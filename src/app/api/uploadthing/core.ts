import db from '@/db'

import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { TRPCError } from '@trpc/server'
import { PDFLoader } from 'langchain/document_loaders/fs/pdf'
import { pineconeIndex } from '@/lib/pinecone'
import { OpenAIEmbeddings } from '@langchain/openai'
import { PineconeStore } from 'langchain/vectorstores/pinecone'

const f = createUploadthing()
export const ourFileRouter = {
	uploadPdf: f({ ['pdf']: { maxFileSize: '4MB' } })
		.middleware(async ({ req }) => {
			const { getUser } = getKindeServerSession()
			const user = await getUser()
			if (!user || !user.id) throw new TRPCError({ code: 'UNAUTHORIZED' })
			return { userId: user.id }
		})
		.onUploadComplete(async ({ metadata, file }) => {
			const createdFile = await db.file.create({
				data: {
					key: file.key,
					name: file.name,
					userId: metadata.userId,
					url: file.url,
					uploadStatus: 'PROCESSING'
				}
			})
			try {
				const response = await fetch(file.url),
					blob = await response.blob(),
					loader = new PDFLoader(blob),
					pageLevelDocs = await loader.load(),
					embeddings = new OpenAIEmbeddings({
						openAIApiKey: process.env.OPEN_AI_KEY
					})
				await PineconeStore.fromDocuments(pageLevelDocs, embeddings, {
					pineconeIndex,
					namespace: createdFile.id
				})
				await db.file.update({
					data: {
						uploadStatus: 'SUCCESS'
					},
					where: { id: createdFile.id }
				})
			} catch (err) {
				await db.file.update({
					data: {
						uploadStatus: 'FAILED'
					},
					where: { id: createdFile.id }
				})
			}
		})
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
