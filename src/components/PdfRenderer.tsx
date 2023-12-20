'use client'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import 'simplebar-react/dist/simplebar.min.css'
import SimpleBar from 'simplebar-react'

import { useCallback, useState } from 'react'

import { Document, Page, pdfjs } from 'react-pdf'
import { ChevronDown, ChevronUp, Loader2, RotateCw, Search } from 'lucide-react'

import { useResizeDetector } from 'react-resize-detector'

import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import { cn } from '@/lib/utils'

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

import { PdfFullScreen } from '@/components/PdfFullScreen'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
	'pdfjs-dist/build/pdf.worker.min.js',
	import.meta.url
).toString()
type MethodType = 'inc' | 'dec'
const ValidateInput = (value: any) =>
	z.object({
		page: z
			.string()
			.refine(num => Number(num) > 0 && Number(num) <= Number(value))
	})
type ValidateType = z.infer<ReturnType<typeof ValidateInput>>
type InitialStateType = {
	numPages: number
	currentPage: number
	scale: number
	rotation: number
}
const initialState: InitialStateType = {
	numPages: 1,
	currentPage: 1,
	scale: 1,
	rotation: 0
}
export const PdfRenderer = ({ url }: { url: string }) => {
	const [state, setState] = useState(initialState)
	const {
		register,
		handleSubmit,
		formState: { errors },
		setValue
	} = useForm<ValidateType>({
		defaultValues: { page: '1' },
		resolver: zodResolver(ValidateInput(state.numPages))
	})
	const { toast } = useToast()
	const { width, ref } = useResizeDetector({
		refreshMode: 'debounce'
	})
	const onChangePage = useCallback(
		(method: MethodType) => () => {
			if (method === 'dec') {
				setState(prev => ({
					...prev,
					currentPage: prev.currentPage - 1 < 1 ? 1 : prev.currentPage - 1
				}))
				setValue('page', String(state.currentPage - 1))
			} else {
				setState(prev => ({
					...prev,
					currentPage:
						prev.currentPage + 1 < Number(state.numPages)
							? prev.currentPage + 1
							: Number(state.numPages)
				}))
				setValue('page', String(state.currentPage + 1))
			}
		},
		[setValue, state.currentPage, state.numPages]
	)
	const onHandleSubmit = handleSubmit(({ page }: ValidateType) => {
		setState(prev => ({
			...prev,
			currentPage: Number(page)
		}))
		setValue('page', String(page))
	})
	const onScale = useCallback(
		(value: number) => () =>
			setState(prev => ({
				...prev,
				scale: value
			})),
		[]
	)
	return (
		<div className='w-full bg-white rounded-md shadow flex flex-col items-center'>
			<div className='h-14 w-full border-b border-zinc-200 flex items-center justify-between px-2'>
				<div className='flex items-center gap-1.5'>
					<Button
						disabled={state.currentPage === 1}
						onClick={onChangePage('dec')}
						variant='ghost'
						aria-label='previous page'
					>
						<ChevronDown className='h-4 w-4' />
					</Button>
					<div className='flex items-center gap-1.5'>
						<Input
							{...register('page')}
							className={cn(
								'w-10 h-7 text-sm text-center',
								errors.page && 'focus-visible:ring-red-500'
							)}
							type='number'
							onKeyDown={ev => ev.key === 'Enter' && onHandleSubmit()}
						/>
						<p className='text-zinc-700 text-sm space-x-1'>
							<span>/</span>
							<span>{state.numPages ?? 'x'}</span>
						</p>
					</div>
					<Button
						disabled={
							state.numPages === undefined ||
							state.currentPage === Number(state.numPages)
						}
						onClick={onChangePage('inc')}
						variant='ghost'
						aria-label='next page'
					>
						<ChevronUp className='h-4 w-4' />
					</Button>
				</div>
				<div className='space-x-2'>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant='outline' aria-label='zoom'>
								<Search className='h-4 w-4' />
								{state.scale * 100}%
								<ChevronDown className='h-3 w-3 opacity-50' />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuItem onSelect={onScale(1)}>100%</DropdownMenuItem>
							<DropdownMenuItem onSelect={onScale(1.5)}>150%</DropdownMenuItem>
							<DropdownMenuItem onSelect={onScale(2)}>200%</DropdownMenuItem>
							<DropdownMenuItem onSelect={onScale(2.5)}>250%</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
					<Button
						onClick={() =>
							setState(prev => ({
								...prev,
								rotation: prev.rotation + 90
							}))
						}
						variant='ghost'
						aria-label='rotate 90 degrees'
					>
						<RotateCw className='h-4 w-4' />
					</Button>
					<PdfFullScreen url={url} />
				</div>
			</div>
			<div className='flex-1 w-full max-h-screen'>
				<SimpleBar autoHide={false} className='max-h-[calc(100vh-10rem)]'>
					<div ref={ref}>
						<Document
							loading={
								<div className='flex justify-center'>
									<Loader2 className='my-24 h-6 w-6 animate-spin' />
								</div>
							}
							onLoadSuccess={({ numPages }) =>
								setState(prev => ({
									...prev,
									numPages
								}))
							}
							onLoadError={err =>
								toast({
									variant: 'destructive',
									title: 'Something went wrong',
									description: err.message
								})
							}
							file={url}
							className='max-h-full'
						>
							<Page
								width={width ? width : 1}
								pageNumber={state.currentPage}
								scale={state.scale}
								rotate={state.rotation}
							/>
						</Document>
					</div>
				</SimpleBar>
			</div>
		</div>
	)
}
