import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { X, Mail, Lock, User } from 'lucide-react'
import toast from 'react-hot-toast'
import './UserRegister.css'

export default function UserRegister() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleClose = () => {
    navigate('/')
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const { error } = await signUp(formData.email, formData.password, {
        name: formData.name,
        role: 'user'
      })
      
      if (error) {
        if (error.message.includes('email')) {
          toast.error('This email is already registered.')
        } else if (error.message.includes('password')) {
          toast.error('Password is too weak.')
        } else {
          toast.error(error.message || 'Registration failed.')
        }
        throw error
      }
      
      toast.success('Registration successful! Please check your email.')
      navigate('/login', { replace: true })
    } catch (err) {
      setLoading(false)
    }
  }

  return (
    <div className="register-modal-overlay" onClick={handleClose}>
      <div className="register-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="modal-close-btn" onClick={handleClose}>
          <X />
        </button>

        {/* Modal Content */}
        <div className="modal-content">
          <h2 className="modal-title">Create Account</h2>
          <p className="modal-subtitle">Join us and start booking amazing events</p>

          <form onSubmit={handleSubmit} className="register-form-modal">
            <div className="form-group-modal">
              <label className="form-label-modal">Full Name</label>
              <div className="input-with-icon">
                <User className="input-icon" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input-modal"
                  placeholder="Enter your full name"
                  required
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="form-group-modal">
              <label className="form-label-modal">Email Address</label>
              <div className="input-with-icon">
                <Mail className="input-icon" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
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
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input-modal"
                  placeholder="Create a password"
                  required
                  autoComplete="new-password"
                  minLength={6}
                />
              </div>
            </div>

            <div className="form-group-modal">
              <label className="form-label-modal">Confirm Password</label>
              <div className="input-with-icon">
                <Lock className="input-icon" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="form-input-modal"
                  placeholder="Confirm your password"
                  required
                  autoComplete="new-password"
                  minLength={6}
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
              ) : 'Create Account'}
            </button>
          </form>

          <div className="modal-footer-section">
            <p className="signup-text">
              Already have an account?{' '}
              <Link to="/login" className="signup-link">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
