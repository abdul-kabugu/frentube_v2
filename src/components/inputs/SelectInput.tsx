import useGetTheme from '@/hooks/useGetTheme'
import { cx } from '@/utils/class-names'
import { Listbox, Transition } from '@headlessui/react'
import Image, { StaticImageData } from 'next/image'
import { Fragment } from 'react'
import { IoIosArrowDown } from 'react-icons/io'

export type ListItem<AdditionalData> = {
  id: string
  icon: StaticImageData
  label: string
  disabledItem?: boolean
} & AdditionalData

type SelectInputProps<AdditionalData> = {
  fieldLabel?: string
  items: ListItem<AdditionalData>[]
  selected: ListItem<AdditionalData>
  setSelected: (item: ListItem<AdditionalData>) => void
  imgClassName?: string
  renderItem?: (item: ListItem<AdditionalData>, open: boolean) => JSX.Element
}

export default function SelectInput<AdditionalData = {}>({
  items,
  fieldLabel,
  selected,
  setSelected,
  imgClassName,
  renderItem,
}: SelectInputProps<AdditionalData>) {
  const theme = useGetTheme()

  return (
    <div>
      <Listbox value={selected} onChange={setSelected}>
        {({ open }) => (
          <>
            {fieldLabel && (
              <Listbox.Label className='block text-sm font-normal leading-4 text-text-muted'>
                {fieldLabel}
              </Listbox.Label>
            )}
            <div className='relative mt-2'>
              <Listbox.Button
                className={cx(
                  'relative w-full cursor-default rounded-2xl',
                  ' py-2 pl-4 pr-12 text-left',
                  'text-base leading-6 ring-1 ring-inset ring-gray-500',
                  'focus:outline-none focus:ring-1 focus:ring-gray-400 ',
                  theme === 'light'
                    ? 'bg-slate-200 text-black'
                    : 'bg-slate-900 text-white'
                )}
              >
                <span className='flex items-center'>
                  <Image
                    src={selected.icon}
                    className={cx('rounded-full', imgClassName)}
                    alt=''
                    role='presentation'
                  />
                  <span className='ml-3 block truncate'>{selected.label}</span>
                </span>
                <span className='pointer-events-none absolute inset-y-0 right-0 ml-2 flex items-center pr-4'>
                  <IoIosArrowDown
                    className='h-5 w-5 text-text-muted'
                    aria-hidden='true'
                  />
                </span>
              </Listbox.Button>

              <Transition
                show={open}
                as={Fragment}
                leave='transition ease-in duration-100'
                leaveFrom='opacity-100'
                leaveTo='opacity-0'
              >
                <Listbox.Options
                  className={cx(
                    'rounded-lg bg-background-light shadow-[0_5px_50px_-12px_rgb(0,0,0,.25)] dark:shadow-[0_5px_50px_-12px_rgb(0,0,0)]',
                    'absolute z-10 mt-1 max-h-56 w-full overflow-auto',
                    'p-1.5 text-base shadow-lg',
                    'ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm'
                  )}
                >
                  {items.map((item, i) => {
                    const renderedItem = renderItem?.(item, open)

                    return (
                      <SelectListItem
                        key={i}
                        item={item}
                        imgClassName={imgClassName}
                        renderedItem={renderedItem}
                      />
                    )
                  })}
                </Listbox.Options>
              </Transition>
            </div>
          </>
        )}
      </Listbox>
    </div>
  )
}

type SelectListItemProps<AdditionalData> = {
  item: ListItem<AdditionalData>
  imgClassName?: string
  renderedItem?: JSX.Element
}

function SelectListItem<AdditionalData>({
  item,
  imgClassName,
  renderedItem,
}: SelectListItemProps<AdditionalData>) {
  const theme = useGetTheme()

  return (
    <Listbox.Option
      disabled={item.disabledItem}
      className={() =>
        cx(
          'relative flex items-center rounded-lg outline-none transition-colors',
          'gap-4 px-3 py-2 hover:bg-background-lighter focus:bg-background-lighter',
          { ['hover:bg-background-light']: item.disabledItem },
          theme === 'light' ? 'text-black' : 'text-white'
        )
      }
      value={item}
    >
      {() => (
        <div className='flex w-full items-center justify-between gap-1'>
          {renderedItem ? (
            renderedItem
          ) : (
            <>
              <div className='flex items-center'>
                <Image
                  src={item.icon}
                  className={cx('rounded-full', imgClassName)}
                  alt=''
                  role='presentation'
                />
                <span
                  className={cx('ml-3 block truncate text-base', {
                    ['text-gray-500']: item.disabledItem,
                  })}
                >
                  {item.label}
                </span>
              </div>
              {item.disabledItem && <div className='text-gray-500'>Soon</div>}
            </>
          )}
        </div>
      )}
    </Listbox.Option>
  )
}
