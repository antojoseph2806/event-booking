import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { X, Mail, Lock, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import './AdminLogin.css'

export default function AdminLogin() {
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

    const { data, error } = await signIn(email, password)
    
    if (error) {
      toast.error(error.message || 'Login failed')
      setLoading(false)
    } else {
      // Check if user is admin
      if (data.user?.user_metadata?.role === 'admin') {
        toast.success('Welcome back, Admin!')
        navigate('/admin/dashboard')
      } else {
        toast.error('Unauthorized: Admin access only')
        setLoading(false)
      }
    }
  }

  return (
    <div className="admin-modal-overlay" onClick={handleClose}>
      <div className="admin-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="modal-close-btn" onClick={handleClose}>
          <X />
        </button>

        {/* Modal Content */}
        <div className="modal-content">
          {/* Admin Badge */}
          <div className="admin-badge">
            <Shield className="admin-shield-icon" />
          </div>

          <h2 className="modal-title">Admin Portal</h2>
          <p className="modal-subtitle">Secure access for administrators only</p>

          <form onSubmit={handleSubmit} className="admin-form-modal">
            <div className="form-group-modal">
              <label className="form-label-modal">Admin Email</label>
              <div className="input-with-icon">
                <Mail className="input-icon" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input-modal"
                  placeholder="Enter admin email"
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
                  placeholder="Enter password"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="submit-btn-modal admin-btn"
            >
              {loading ? (
                <span className="loading-spinner-small"></span>
              ) : 'Admin Sign In'}
            </button>
          </form>

          <div className="modal-footer-section">
            <div className="divider-line-full"></div>
            
            <Link to="/login" className="user-login-link">
              User Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
