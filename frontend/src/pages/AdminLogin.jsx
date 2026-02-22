import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Shield, Mail, Lock, ArrowLeft } from 'lucide-react'
import './AdminLogin.css'

export default function AdminLogin() {
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

    const { data, error } = await signIn(email, password)
    
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      // Check if user is admin
      if (data.user?.user_metadata?.role === 'admin') {
        navigate('/admin/dashboard')
      } else {
        setError('Unauthorized: Admin access only')
        setLoading(false)
      }
    }
  }

  return (
    <div className="admin-login-container">
      <div className="admin-login-screen">
        {/* Background Orbs */}
        <div className="bg-orb orb-1"></div>
        <div className="bg-orb orb-2"></div>

        {/* Back Button */}
        <Link to="/" className="back-nav">
          <ArrowLeft />
          <span>Back to Home</span>
        </Link>

        {/* Login Content */}
        <div className="login-content">
          {/* Admin Icon */}
          <div className="admin-icon-container">
            <div className="admin-icon-wrapper">
              <Shield />
            </div>
          </div>

          {/* Title Section */}
          <div className="admin-title-section">
            <h1 className="admin-title">Admin Portal</h1>
            <p className="admin-subtitle">Secure admin access</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-group">
              <label className="form-label">Admin Email</label>
              <div className="input-wrapper">
                <Mail className="input-icon" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="admin-input"
                  placeholder="Enter admin email"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="admin-input"
                  placeholder="Enter password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="admin-submit-btn"
            >
              {loading ? 'Signing in...' : 'Admin Sign In'}
            </button>
          </form>

          {/* User Login Link */}
          <div className="user-login-link">
            <Link to="/login">User Login</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
