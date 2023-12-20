import { Pinecone } from '@pinecone-database/pinecone'

const client = new Pinecone({
	apiKey: String(process.env.PINECONE_API),
	environment: 'gcp-starter'
})
export const pineconeIndex = client.Index('quill')
