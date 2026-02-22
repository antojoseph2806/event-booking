import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './UserLogin.css'

export default function UserLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error } = await signIn(email, password)
      
      if (error) {
        if (error.message.includes('email') && error.message.includes('confirmed')) {
          setError('Please confirm your email address before logging in.')
        } else if (error.message.includes('Invalid login credentials')) {
          setError('Invalid email or password.')
        } else {
          setError(error.message || 'Login failed. Please try again.')
        }
        throw error
      }
      
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
    <div className="login-container">
      <div className="login-screen">
        {/* Background Orbs */}
        <div className="bg-orb orb-1"></div>
        <div className="bg-orb orb-2"></div>
        <div className="bg-orb orb-3"></div>

        {/* Back Button */}
        <button className="back-btn" onClick={() => navigate('/')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>

        {/* Login Card */}
        <div className="login-card">
          <div className="logo-section">
            <div className="logo-circle">
              <span className="logo-text-small">HyperMoth</span>
            </div>
          </div>

          <h1 className="login-title">Welcome Back</h1>
          <p className="login-subtitle">Sign in to continue</p>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="Enter your email"
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="submit-btn"
            >
              {loading ? (
                <span className="loading-spinner-small"></span>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="login-footer">
            <p className="footer-text">
              Don't have an account?{' '}
              <Link to="/register" className="footer-link">
                Sign up
              </Link>
            </p>
            <Link to="/admin/login" className="admin-link">
              Admin Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
