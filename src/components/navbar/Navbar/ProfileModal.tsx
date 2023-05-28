import BulbIcon from '@/assets/icons/bulb.svg'
import EthIcon from '@/assets/icons/eth.svg'
import ExitIcon from '@/assets/icons/exit.svg'
import ExternalLinkIcon from '@/assets/icons/external-link.svg'
import InfoIcon from '@/assets/icons/info.svg'
import KeyIcon from '@/assets/icons/key.svg'
import ShareIcon from '@/assets/icons/share.svg'
import Button from '@/components/Button'
import { CopyText, CopyTextInline } from '@/components/CopyText'
import LinkText from '@/components/LinkText'
import Logo from '@/components/Logo'
import Modal, { ModalFunctionalityProps } from '@/components/modals/Modal'
import ProfilePreview from '@/components/ProfilePreview'
import { SUGGEST_FEATURE_LINK } from '@/constants/links'
import { ACCOUNT_SECRET_KEY_URL_PARAMS } from '@/pages/account'
import { getLinkedEvmAddressQuery } from '@/services/subsocial/evmAddresses'
import { useUnlinkEvmAddress } from '@/services/subsocial/evmAddresses/mutation'
import { useSendEvent } from '@/stores/analytics'
import { useMyAccount } from '@/stores/my-account'
import { decodeSecretKey, truncateAddress } from '@/utils/account'
import { cx } from '@/utils/class-names'
import { getCurrentUrlOrigin } from '@/utils/links'
import React, { useEffect, useState } from 'react'
import QRCode from 'react-qr-code'
import urlJoin from 'url-join'
import { useAccount, useDisconnect } from 'wagmi'
import { CustomConnectButton } from '../../modals/login/CustomConnectButton'
import { useSignMessageAndLinkEvmAddress } from '../../modals/login/utils'

type NotificationControl = {
  showNotif: boolean
  setNotifDone: () => void
}

export type ProfileModalProps = ModalFunctionalityProps & {
  address: string
  notification?: NotificationControl
}

type ModalState =
  | 'account'
  | 'private-key'
  | 'logout'
  | 'share-session'
  | 'about'
  | 'connect-evm-address'
  | 'evm-connecting-error'
  | 'disconect-evm-confirmation'
const modalTitles: {
  [key in ModalState]: {
    title: React.ReactNode
    desc?: React.ReactNode
    withBackButton?: boolean
  }
} = {
  account: { title: <span className='font-medium'>My Account</span> },
  logout: {
    title: '🤔 Did you back up your Grill secret key?',
    withBackButton: true,
  },
  'private-key': {
    title: '🔑 Grill secret key',
    withBackButton: true,
  },
  'share-session': {
    title: '💻 Share session',
    desc: 'Use this link or scan the QR code to quickly log in to this account on another device.',
    withBackButton: true,
  },
  about: {
    title: 'About app',
    desc: null,
    withBackButton: true,
  },
  'connect-evm-address': {
    title: '🔑 Link Your EVM Address',
    desc: 'A connected Ethereum address is associated with your Grill account via an of-chain proof, allowing you to display and use NFTs. ',
    withBackButton: true,
  },
  'evm-connecting-error': {
    title: '😕 Something went wrong',
    desc: 'This might be related to the transaction signature. You can try again, or come back to it later.',
    withBackButton: false,
  },
  'disconect-evm-confirmation': {
    title: '🤔 Disconnect this address?',
    desc: undefined,
    withBackButton: false,
  },
}

type ContentProps = {
  address: string
  setCurrentState: React.Dispatch<React.SetStateAction<ModalState>>
  notification?: NotificationControl
  evmAddress?: string
}
const modalContents: {
  [key in ModalState]: (props: ContentProps) => JSX.Element
} = {
  account: AccountContent,
  'private-key': PrivateKeyContent,
  logout: LogoutContent,
  'share-session': ShareSessionContent,
  about: AboutContent,
  'connect-evm-address': ConnectedEvmAddressContent,
  'evm-connecting-error': EvmLoginError,
  'disconect-evm-confirmation': DisconnectEvmConfirmationContent,
}

export default function ProfileModal({
  address,
  notification,
  ...props
}: ProfileModalProps) {
  const [currentState, setCurrentState] = useState<ModalState>('account')
  // const { disconnect } = useDisconnect()
  const { data: linkedEvmAddress } = getLinkedEvmAddressQuery.useQuery(address)

  useEffect(() => {
    if (props.isOpen) setCurrentState('account')
  }, [props.isOpen])

  const onBackClick = () => setCurrentState('account')
  const { title, desc, withBackButton } = modalTitles[currentState] || {}
  const Content = modalContents[currentState]

  const isAccountState = currentState === 'account'

  return (
    <Modal
      {...props}
      title={title}
      description={desc}
      contentClassName={cx(isAccountState && 'px-0 pb-0')}
      titleClassName={cx(isAccountState && 'px-6')}
      withFooter={isAccountState}
      withCloseButton
      onBackClick={withBackButton ? onBackClick : undefined}
      closeModal={() => {
        props.closeModal()
        // disconnect()
      }}
    >
      <Content
        address={address}
        setCurrentState={setCurrentState}
        notification={notification}
        evmAddress={linkedEvmAddress}
      />
    </Modal>
  )
}

type ButtonData = {
  text: string
  icon: React.ComponentType<{ className?: string }>
  onClick?: () => void
  href?: string
  notification?: NotificationControl
}

function AccountContent({
  address,
  setCurrentState,
  notification,
  evmAddress,
}: ContentProps) {
  const sendEvent = useSendEvent()
  const { disconnect } = useDisconnect()

  const onConnectEvmAddressClick = () => {
    sendEvent('click connect_evm_address')
    setCurrentState('connect-evm-address')
  }
  const onShowPrivateKeyClick = () => {
    sendEvent('click show_private_key_button')
    setCurrentState('private-key')
  }
  const onShareSessionClick = () => {
    sendEvent('click share_session_button')
    setCurrentState('share-session')
  }
  const onLogoutClick = () => {
    disconnect()
    sendEvent('click log_out_button')
    setCurrentState('logout')
  }
  const onAboutClick = () => {
    sendEvent('click about_app_button')
    setCurrentState('about')
  }

  const buttons: ButtonData[] = [
    {
      text: 'Connect EVM address',
      icon: EthIcon,
      onClick: onConnectEvmAddressClick,
      notification,
    },
    {
      text: 'Show Grill secret key',
      icon: KeyIcon,
      onClick: onShowPrivateKeyClick,
      notification,
    },
    { text: 'Share session', icon: ShareIcon, onClick: onShareSessionClick },
    {
      text: 'Suggest feature',
      icon: BulbIcon,
      href: SUGGEST_FEATURE_LINK,
    },
    {
      text: 'About app',
      icon: InfoIcon,
      onClick: onAboutClick,
    },
    { text: 'Log out', icon: ExitIcon, onClick: onLogoutClick },
  ]

  return (
    <div className='mt-2 flex flex-col'>
      <ProfilePreview
        address={address}
        evmAddress={evmAddress}
        className='border-b border-background-lightest px-6 pb-6'
      />
      <div className='flex w-full flex-col gap-6 py-6 px-3'>
        {buttons.map(({ icon: Icon, onClick, text, href, notification }) => (
          <Button
            key={text}
            href={href}
            target='_blank'
            rel='noopener noreferrer'
            variant='transparent'
            size='noPadding'
            interactive='none'
            className={cx(
              'relative flex items-center px-6 [&>*]:z-10',
              'after:absolute after:top-1/2 after:left-0 after:h-full after:w-full after:-translate-y-1/2 after:rounded-lg after:bg-transparent after:py-6 after:transition-colors',
              'outline-none focus:after:bg-background-lighter hover:after:bg-background-lighter '
            )}
            onClick={() => {
              notification?.setNotifDone()
              onClick?.()
            }}
          >
            <Icon className='mr-6 text-xl text-text-muted' />
            <span>{text}</span>
            {notification?.showNotif && (
              <span className='relative ml-2 h-2 w-2'>
                <span className='absolute inset-0 inline-flex h-full w-full animate-ping rounded-full bg-background-warning opacity-75'></span>
                <span className='relative block h-full w-full rounded-full bg-background-warning' />
              </span>
            )}
          </Button>
        ))}
      </div>
    </div>
  )
}

function ConnectedEvmAddressContent({
  evmAddress,
  setCurrentState,
}: ContentProps) {
  const { address: addressFromExt } = useAccount()

  const { signAndLinkEvmAddress, isSigningMessage } =
    useSignMessageAndLinkEvmAddress({
      setModalStep: () => setCurrentState('connect-evm-address'),
      onError: () => setCurrentState('evm-connecting-error'),
    })

  const addressFromExtLovercased = addressFromExt?.toLowerCase()

  const isNotEqAddresses =
    addressFromExtLovercased &&
    evmAddress &&
    evmAddress !== addressFromExtLovercased

  const connectionButton = (
    <CustomConnectButton
      className={cx('w-full', { ['mt-4']: isNotEqAddresses })}
      signAndLinkEvmAddress={signAndLinkEvmAddress}
      signAndLinkOnConnect={!isNotEqAddresses}
      isSigningMessage={isSigningMessage}
      label={isNotEqAddresses ? 'Link another account' : undefined}
      variant={isNotEqAddresses ? 'primaryOutline' : 'primary'}
    />
  )

  return (
    <div>
      {evmAddress ? (
        <div>
          <div className='flex justify-between'>
            <CopyTextInline
              text={truncateAddress(evmAddress)}
              tooltip='Copy my Grill public address'
              tooltipPlacement='top'
              textToCopy={evmAddress}
              textClassName='font-mono'
            />
            <LinkText
              openInNewTab
              href={`https://etherscan.io/address/${evmAddress}`}
              variant='primary'
            >
              <span className='flex items-center'>
                Etherscan <ExternalLinkIcon className='ml-2 text-text-muted' />
              </span>
            </LinkText>
          </div>
          {isNotEqAddresses && connectionButton}
          <Button
            onClick={() => setCurrentState('disconect-evm-confirmation')}
            className='mt-6 w-full border-red-500'
            variant='primaryOutline'
            size='lg'
          >
            Disconnect
          </Button>
        </div>
      ) : (
        connectionButton
      )}
    </div>
  )
}

function DisconnectEvmConfirmationContent({
  setCurrentState,
  evmAddress,
}: ContentProps) {
  const sendEvent = useSendEvent()
  const { mutate: unlinkEvmAddress } = useUnlinkEvmAddress(() =>
    setCurrentState('connect-evm-address')
  )

  const onButtonClick = () => {
    setCurrentState('connect-evm-address')
    sendEvent(`click keep-evm-address-connected`)
  }

  const onDisconnectClick = () => {
    if (!evmAddress) return
    sendEvent('click disconnect-evm-address')
    unlinkEvmAddress({ evmAddress })
  }

  return (
    <div className='mt-4 flex flex-col gap-4'>
      <Button size='lg' onClick={onButtonClick}>
        No, keep it connected
      </Button>
      <Button
        size='lg'
        onClick={onDisconnectClick}
        variant='primaryOutline'
        className='border-red-500'
      >
        Yes, disconnect
      </Button>
    </div>
  )
}

function PrivateKeyContent() {
  const encodedSecretKey = useMyAccount((state) => state.encodedSecretKey)
  const secretKey = decodeSecretKey(encodedSecretKey ?? '')

  const sendEvent = useSendEvent()
  const onCopyClick = () => {
    sendEvent('click copy_private_key_button')
  }

  return (
    <div className='flex flex-col items-center gap-4'>
      <p className='mb-2 text-text-muted'>
        Grill secret key is like a long password. We recommend keeping it in a
        safe place, so you can recover your account.
      </p>
      <CopyText onCopyClick={onCopyClick} isCodeText text={secretKey || ''} />
    </div>
  )
}

function LogoutContent({ setCurrentState }: ContentProps) {
  const logout = useMyAccount((state) => state.logout)
  const sendEvent = useSendEvent()

  const onShowPrivateKeyClick = () => {
    sendEvent('click no_show_me_my_private_key_button')
    setCurrentState('private-key')
  }
  const onLogoutClick = () => {
    sendEvent('click yes_log_out_button')
    logout()
  }

  return (
    <div className='mt-4 flex flex-col gap-4'>
      <Button size='lg' onClick={onShowPrivateKeyClick}>
        No, show me my Grill secret key
      </Button>
      <Button size='lg' onClick={onLogoutClick} variant='primaryOutline'>
        Yes, log out
      </Button>
    </div>
  )
}

function ShareSessionContent() {
  const encodedSecretKey = useMyAccount((state) => state.encodedSecretKey)
  const sendEvent = useSendEvent()
  const onCopyClick = () => {
    sendEvent('click copy_share_session_link')
  }

  const shareSessionLink = urlJoin(
    getCurrentUrlOrigin(),
    `/account?${ACCOUNT_SECRET_KEY_URL_PARAMS}=${encodedSecretKey}`
  )

  return (
    <div className='mt-2 flex flex-col gap-4'>
      <div className='mx-auto mb-2 h-40 w-40 rounded-2xl bg-white p-4'>
        <QRCode
          value={shareSessionLink}
          size={256}
          className='h-full w-full'
          viewBox='0 0 256 256'
        />
      </div>
      <CopyText text={shareSessionLink} onCopyClick={onCopyClick} />
    </div>
  )
}

function AboutContent() {
  return (
    <div className='mt-2 flex flex-col gap-4'>
      <div className='flex justify-center'>
        <Logo className='text-5xl' />
      </div>
      <p className='text-text-muted'>
        Engage in discussions anonymously without fear of social persecution.
        Grill.chat runs on the{' '}
        <LinkText
          openInNewTab
          href='https://subsocial.network/xsocial'
          variant='primary'
        >
          xSocial
        </LinkText>{' '}
        blockchain and backs up its content to{' '}
        <LinkText openInNewTab href='https://ipfs.tech/' variant='primary'>
          IPFS
        </LinkText>
        .
      </p>
      <div className='rounded-2xl border border-background-warning py-2 px-4 text-text-warning'>
        xSocial is an experimental environment for innovative web3 social
        features before they are deployed on{' '}
        <LinkText
          openInNewTab
          href='https://subsocial.network'
          variant='primary'
        >
          Subsocial
        </LinkText>
      </div>
    </div>
  )
}

function EvmLoginError({ setCurrentState }: ContentProps) {
  const { signAndLinkEvmAddress, isSigningMessage } =
    useSignMessageAndLinkEvmAddress({
      setModalStep: () => setCurrentState('connect-evm-address'),
      onError: () => setCurrentState('evm-connecting-error'),
    })

  return (
    <CustomConnectButton
      isSigningMessage={isSigningMessage}
      signAndLinkOnConnect={false}
      signAndLinkEvmAddress={signAndLinkEvmAddress}
      className='w-full'
      label='Try again'
    />
  )
}
