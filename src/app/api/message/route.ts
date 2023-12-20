import db from '@/db'

import { NextRequest } from 'next/server'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { SendMessageValidator } from '@/lib/validate/SendMessageValidator'
import { OpenAIEmbeddings } from '@langchain/openai'
import { PineconeStore } from 'langchain/vectorstores/pinecone'
import { openai } from '@/lib/openai'
import { OpenAIStream, StreamingTextResponse } from 'ai'
import { pineconeIndex } from '@/lib/pinecone'

export const POST = async (req: NextRequest) => {
	const body = await req.json()
	const { getUser } = getKindeServerSession()
	const user = await getUser()
	if (!user?.id) return new Response('UnauthorizedError', { status: 401 })
	const { message, fileId } = SendMessageValidator.parse(body)
	const file = await db.file.findFirst({
		where: { id: fileId, userId: user.id }
	})
	if (!file) return new Response('Not Found', { status: 404 })
	await db.message.create({
		data: {
			text: message,
			isUserMessage: true,
			userId: user.id,
			fileId
		}
	})
	const embedding = new OpenAIEmbeddings({
			openAIApiKey: process.env.OPEN_AI_KEY
		}),
		vectorStore = await PineconeStore.fromExistingIndex(embedding, {
			pineconeIndex,
			namespace: file.id
		}),
		results = await vectorStore.similaritySearch(message, 4),
		prevMessages = await db.message.findMany({
			where: { fileId },
			orderBy: { createdAt: 'asc' },
			take: 6
		}),
		formattedMessages = prevMessages.map(msg => ({
			role: msg.isUserMessage ? ('user' as const) : ('assistant' as const),
			content: msg.text
		})),
		response = await openai.chat.completions.create({
			model: 'gpt-3.5-turbo',
			temperature: 0,
			stream: true,
			messages: [
				{
					role: 'system',
					content:
						'Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format.'
				},
				{
					role: 'user',
					content: `Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format. \nIf you don't know the answer, just say that you don't know, don't try to make up an answer.
        
  \n----------------\n
  
  PREVIOUS CONVERSATION:
  ${formattedMessages.map(message => {
		if (message.role === 'user') return `User: ${message.content}\n`
		return `Assistant: ${message.content}\n`
	})}
  
  \n----------------\n
  
  CONTEXT:
  ${results.map(r => r.pageContent).join('\n\n')}
  
  USER INPUT: ${message}`
				}
			]
		}),
		stream = OpenAIStream(response, {
			async onCompletion(completion) {
				await db.message.create({
					data: {
						text: completion,
						isUserMessage: false,
						fileId,
						userId: user.id
					}
				})
			}
		})
	return new StreamingTextResponse(stream)
}
