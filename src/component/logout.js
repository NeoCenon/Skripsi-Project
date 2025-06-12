import { useAuth } from '../context/authcontext'
import { useRouter } from 'next/router'

export default function LogoutButton() {
  const { signOut } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <button onClick={handleLogout}>
      Logout
    </button>
  )
}