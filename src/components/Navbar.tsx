import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import {
	getKindeServerSession,
	LoginLink,
	RegisterLink
} from '@kinde-oss/kinde-auth-nextjs/server'
import { ArrowRight } from 'lucide-react'
import { UserAccountNav } from '@/components/UserAccountNav'

export default async function Navbar() {
	const { getUser } = getKindeServerSession()
	const user = await getUser()
	return (
		<nav
			className='sticky h-14 inset-x-0 top-0 z-30 w-full border-b border-gray-200 bg-white/75
		 backdrop-blur-lg transition-all'
		>
			<MaxWidthWrapper>
				<div className='flex h-14 items-center justify-between border-b border-zinc-200'>
					<Link href={'/'} className='flex z-40 font-semibold'>
						<span>quill.</span>
					</Link>
					{/*to do add mobile navbar*/}
					<div className='hidden items-center space-x-4 sm:flex'>
						{!user ? (
							<>
								<Link
									className={buttonVariants({
										variant: 'ghost',
										size: 'sm'
									})}
									href={'/pricing'}
								>
									Pricing
								</Link>
								<LoginLink
									className={buttonVariants({
										variant: 'ghost',
										size: 'sm'
									})}
								>
									Sign in
								</LoginLink>
								<RegisterLink className={buttonVariants({ size: 'sm' })}>
									Get Started <ArrowRight className='ml-1.5 h-5 w-5' />
								</RegisterLink>
							</>
						) : (
							<>
								<Link
									className={buttonVariants({
										variant: 'ghost',
										size: 'sm'
									})}
									href={'/dashboard'}
								>
									Dashboard
								</Link>
								<UserAccountNav
									name={
										!user.given_name || !user.family_name
											? 'Your account'
											: `${user.given_name} ${user.family_name}`
									}
									email={user.email ?? ''}
									imageUrl={user.picture ?? ''}
								/>
							</>
						)}
					</div>
				</div>
			</MaxWidthWrapper>
		</nav>
	)
}
