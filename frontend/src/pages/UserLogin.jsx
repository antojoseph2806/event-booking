import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { X, Mail, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import './UserLogin.css'

export default function UserLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleClose = () => {
    navigate('/')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await signIn(email, password)
      
      if (error) {
        if (error.message.includes('email') && error.message.includes('confirmed')) {
          toast.error('Please confirm your email address before logging in.')
        } else if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password.')
        } else {
          toast.error(error.message || 'Login failed. Please try again.')
        }
        throw error
      }
      
      toast.success('Welcome back!')
      
      const redirectPath = localStorage.getItem('redirectAfterLogin')
      
      if (redirectPath) {
        localStorage.removeItem('redirectAfterLogin')
        navigate(redirectPath, { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    } catch (err) {
      setLoading(false)
    }
  }

  return (
    <div className="login-modal-overlay" onClick={handleClose}>
      <div className="login-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="modal-close-btn" onClick={handleClose}>
          <X />
        </button>

        {/* Modal Content */}
        <div className="modal-content">
          <h2 className="modal-title">Welcome Back</h2>
          <p className="modal-subtitle">Sign in to continue to your account</p>

          <form onSubmit={handleSubmit} className="login-form-modal">
            <div className="form-group-modal">
              <label className="form-label-modal">Email Address</label>
              <div className="input-with-icon">
                <Mail className="input-icon" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input-modal"
                  placeholder="Enter your email"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group-modal">
              <label className="form-label-modal">Password</label>
              <div className="input-with-icon">
                <Lock className="input-icon" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input-modal"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="submit-btn-modal"
            >
              {loading ? (
                <span className="loading-spinner-small"></span>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="modal-footer-section">
            <p className="signup-text">
              Don't have an account?{' '}
              <Link to="/register" className="signup-link">
                Sign up
              </Link>
            </p>
            
            <div className="divider-line-full"></div>
            
            <Link to="/admin/login" className="admin-modal-link">
              Admin Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
