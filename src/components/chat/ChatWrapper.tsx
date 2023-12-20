'use client'
import { Messages } from '@/components/chat/Messages'
import { ChatInput } from '@/components/chat/ChatInput'
import { trpc } from '@/app/_trpc/client'
import { ChatLoading } from '@/components/chat/ChatWrapperStatus/ChatLoading'
import { ChatError } from '@/components/chat/ChatWrapperStatus/ChatError'
import { ChatProcessing } from '@/components/chat/ChatWrapperStatus/ChatProcessing'
import { ChatContextProvider } from '@/components/chat/ChatContext'

interface ChatWrapperProps {
	fileId: string
}

export const ChatWrapper: React.FC<ChatWrapperProps> = ({ fileId }) => {
	const { data, isLoading } = trpc.getFileUploadStatus.useQuery(fileId, {
		refetchInterval: data =>
			data?.status === 'SUCCESS' || data?.status === 'FAILED' ? 1000 : false
	})
	if (isLoading) return <ChatLoading />
	if (data?.status === 'PROCESSING') return <ChatProcessing />
	if (data?.status === 'FAILED') return <ChatError />
	return (
		<ChatContextProvider fileId={fileId}>
			<div className='relative min-h-full bg-zinc-50 flex divide-y divide-zinc-200 flex-col justify-between gap-2 '>
				<div className='flex-1 justify-between flex flex-col mb-28'>
					<Messages fileId={fileId} />
				</div>
				<ChatInput />
			</div>
		</ChatContextProvider>
	)
}
