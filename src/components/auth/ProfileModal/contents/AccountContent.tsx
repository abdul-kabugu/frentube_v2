import BellIcon from '@/assets/icons/bell.svg'
import BulbIcon from '@/assets/icons/bulb.svg'
import EthIcon from '@/assets/icons/eth.svg'
import ExitIcon from '@/assets/icons/exit.svg'
import InfoIcon from '@/assets/icons/info.svg'
import KeyIcon from '@/assets/icons/key.svg'
import ShareIcon from '@/assets/icons/share.svg'
import DotBlinkingNotification from '@/components/DotBlinkingNotification'
import MenuList, { MenuListProps } from '@/components/MenuList'
import ProfilePreview from '@/components/ProfilePreview'
import { SUGGEST_FEATURE_LINK } from '@/constants/links'
import useFirstVisitNotification from '@/hooks/useFirstVisitNotification'
import { useSendEvent } from '@/stores/analytics'
import { useDisconnect } from 'wagmi'
import { ContentProps } from '../types'

export default function AccountContent({
  address,
  setCurrentState,
  notification,
  evmAddress,
}: ContentProps) {
  const { showNotification, closeNotification } =
    useFirstVisitNotification('notification-menu')

  const sendEvent = useSendEvent()
  const { disconnect } = useDisconnect()

  const onLinkEvmAddressClick = () => {
    sendEvent('click link_evm_address')
    setCurrentState('link-evm-address')
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

  const menus: MenuListProps['menus'] = [
    {
      text: (
        <span className='flex items-center gap-2'>
          <span>Notifications</span>
          {showNotification && <DotBlinkingNotification />}
        </span>
      ),
      icon: BellIcon,
      onClick: () => {
        closeNotification()
        setCurrentState('notifications')
      },
    },
    {
      text: evmAddress ? 'My EVM Address' : 'Link EVM address',
      icon: EthIcon,
      onClick: () => {
        notification?.setNotifDone()
        onLinkEvmAddressClick()
      },
    },
    {
      text: (
        <span className='flex items-center gap-2'>
          <span>Show Grill secret key</span>
          {notification?.showNotif && <DotBlinkingNotification />}
        </span>
      ),
      icon: KeyIcon,
      onClick: () => {
        notification?.setNotifDone()
        onShowPrivateKeyClick()
      },
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
        className='border-b border-background-lightest px-6 pb-6'
      />
      <MenuList menus={menus} />
    </div>
  )
}
