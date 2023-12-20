import Link from 'next/link'

interface StepsProps {
	steps: string
	title: string
	content: string
	link?: string
	textLink?: string
}
export default function Steps({
	steps,
	content,
	title,
	link,
	textLink
}: StepsProps) {
	return (
		<li className='md:flex-1'>
			<div
				className='flex flex-col space-y-2 border-l-2 border-zinc-300 py-2 pl-8
							md:border-l-0 md:border-t-2 md:pb-0 md:pl-0 md:pt-4'
			>
				<span className='text-sm font-medium text-blue-600'>{steps}</span>
				<span className='text-xl font-semibold'>{title}</span>
				<span className='mt-2 text-zinc-700'>
					{content}{' '}
					{link && (
						<Link
							className='text-blue-700 underline underline-offset-2'
							href={link}
						>
							{textLink}
						</Link>
					)}
				</span>
			</div>
		</li>
	)
}
