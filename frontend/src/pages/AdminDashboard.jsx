import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Ticket, 
  TrendingUp,
  DollarSign,
  Activity,
  Menu,
  X,
  LogOut,
  ChevronRight,
  UserCircle,
  Music,
  CreditCard,
  BarChart3,
  Settings
} from 'lucide-react'
import toast from 'react-hot-toast'
import './AdminDashboard.css'

export default function AdminDashboard() {
  const { user, loading, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalUsers: 0,
    activeEvents: 0,
    growthRate: 0,
    userGrowthRate: 0,
    eventGrowthRate: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    weeklyRevenue: 0
  })
  const [recentBookings, setRecentBookings] = useState([])
  const [activities, setActivities] = useState([])
  const [weeklySales, setWeeklySales] = useState([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      navigate('/admin/login')
    }
    if (!loading && user && user.user_metadata?.role !== 'admin') {
      navigate('/dashboard')
    }
  }, [user, loading, navigate])

  useEffect(() => {
    if (user && user.user_metadata?.role === 'admin') {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    try {
      // Fetch bookings
      const { data: bookingsData, count: bookingsCount } = await supabase
        .from('bookings')
        .select('*, events(*), user:profiles(*)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(5)

      // Fetch users count
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      // Fetch active events
      const { count: eventsCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .gte('date', new Date().toISOString())

      // Calculate revenue
      const { data: allBookings } = await supabase
        .from('bookings')
        .select('total_price, created_at')

      const totalRevenue = allBookings?.reduce((sum, b) => sum + (parseFloat(b.total_price) || 0), 0) || 0
      const totalExpenses = totalRevenue * 0.38
      const netProfit = totalRevenue - totalExpenses

      // Calculate weekly sales from actual booking data
      const now = new Date()
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - now.getDay() + 1) // Monday
      weekStart.setHours(0, 0, 0, 0)

      const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      const salesByDay = weekDays.map((day, index) => {
        const dayDate = new Date(weekStart)
        dayDate.setDate(weekStart.getDate() + index)
        const nextDay = new Date(dayDate)
        nextDay.setDate(dayDate.getDate() + 1)

        const daySales = allBookings?.filter(b => {
          const bookingDate = new Date(b.created_at)
          return bookingDate >= dayDate && bookingDate < nextDay
        }).reduce((sum, b) => sum + (parseFloat(b.total_price) || 0), 0) || 0

        return {
          day,
          amount: daySales
        }
      })

      const weeklyRevenue = salesByDay.reduce((sum, day) => sum + day.amount, 0)

      // Calculate growth rate
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const sixtyDaysAgo = new Date()
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

      const lastMonthBookings = allBookings?.filter(b => {
        const date = new Date(b.created_at)
        return date >= thirtyDaysAgo
      }).length || 0

      const previousMonthBookings = allBookings?.filter(b => {
        const date = new Date(b.created_at)
        return date >= sixtyDaysAgo && date < thirtyDaysAgo
      }).length || 0

      const growthRate = previousMonthBookings > 0 
        ? ((lastMonthBookings - previousMonthBookings) / previousMonthBookings * 100).toFixed(1) 
        : 0

      // Calculate user growth
      const { data: recentUsers } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', thirtyDaysAgo.toISOString())

      const { data: previousUsers } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', sixtyDaysAgo.toISOString())
        .lt('created_at', thirtyDaysAgo.toISOString())

      const userGrowthRate = previousUsers?.length > 0
        ? (((recentUsers?.length || 0) - previousUsers.length) / previousUsers.length * 100).toFixed(1)
        : 0

      // Calculate event growth
      const { data: recentEvents } = await supabase
        .from('events')
        .select('created_at')
        .gte('created_at', thirtyDaysAgo.toISOString())

      const { data: previousEvents } = await supabase
        .from('events')
        .select('created_at')
        .gte('created_at', sixtyDaysAgo.toISOString())
        .lt('created_at', thirtyDaysAgo.toISOString())

      const eventGrowthRate = previousEvents?.length > 0
        ? (((recentEvents?.length || 0) - previousEvents.length) / previousEvents.length * 100).toFixed(1)
        : 0

      setStats({
        totalBookings: bookingsCount || 0,
        totalUsers: usersCount || 0,
        activeEvents: eventsCount || 0,
        growthRate: parseFloat(growthRate),
        userGrowthRate: parseFloat(userGrowthRate),
        eventGrowthRate: parseFloat(eventGrowthRate),
        totalRevenue: Math.floor(totalRevenue / 1000),
        totalExpenses: Math.floor(totalExpenses / 1000),
        netProfit: Math.floor(netProfit / 1000),
        weeklyRevenue
      })

      setRecentBookings(bookingsData || [])
      setWeeklySales(salesByDay)

      // Generate activity feed from actual data
      const recentActivitiesList = []
      
      if (recentUsers && recentUsers.length > 0) {
        const latestUser = recentUsers[0]
        const timeAgo = getTimeAgo(new Date(latestUser.created_at))
        recentActivitiesList.push({
          type: 'user',
          message: 'New user registration',
          time: timeAgo,
          icon: 'user'
        })
      }

      if (bookingsData && bookingsData.length > 0) {
        const latestBooking = bookingsData[0]
        const timeAgo = getTimeAgo(new Date(latestBooking.created_at))
        recentActivitiesList.push({
          type: 'booking',
          message: 'New booking confirmed',
          time: timeAgo,
          icon: 'booking'
        })
      }

      if (recentEvents && recentEvents.length > 0) {
        const latestEvent = recentEvents[0]
        const timeAgo = getTimeAgo(new Date(latestEvent.created_at))
        recentActivitiesList.push({
          type: 'event',
          message: 'Event updated',
          time: timeAgo,
          icon: 'event'
        })
      }

      setActivities(recentActivitiesList)

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoadingData(false)
    }
  }

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000)
    
    if (seconds < 60) return `${seconds} sec ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} min ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    const days = Math.floor(hours / 24)
    return `${days} day${days > 1 ? 's' : ''} ago`
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/admin/login')
  }

  const handleMenuToggle = () => {
    setMenuOpen(prev => !prev)
  }

  const handleMenuNavigation = (path) => {
    setMenuOpen(false)
    navigate(path)
  }

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Ticket, label: 'Manage Bookings', path: '/admin/dashboard/bookings' },
    { icon: Users, label: 'Manage Users', path: '/admin/dashboard/users' },
    { icon: Calendar, label: 'Manage Events', path: '/admin/dashboard/events' },
    { icon: Music, label: 'Manage Venues', path: '/admin/dashboard/artists' }
  ]

  if (loading || loadingData) {
    return (
      <div className="admin-dashboard-container">
        {/* Animated Background Elements */}
        <div className="bg-orb orb-1"></div>
        <div className="bg-orb orb-2"></div>
        <div className="bg-orb orb-3"></div>

        {/* Top Navigation Skeleton */}
        <header className="admin-topbar">
          <div className="nav-left">
            <div className="logo-image skeleton-pulse" style={{ background: 'rgba(40,40,40,0.8)' }}></div>
          </div>
          <div className="topbar-welcome">
            <div style={{ width: '150px', height: '24px', background: 'rgba(40,40,40,0.8)', borderRadius: '8px' }} className="skeleton-shimmer"></div>
          </div>
          <div className="nav-right">
            <div className="premium-menu-btn skeleton-pulse" style={{ background: 'rgba(40,40,40,0.8)' }}></div>
          </div>
        </header>

        {/* Main Content Skeleton */}
        <main className="admin-main">
          <div className="dashboard-content">
            {/* Stats Cards Skeleton */}
            <div className="stats-grid">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton-stat-card skeleton-shimmer"></div>
              ))}
            </div>

            {/* Dashboard Grid Skeleton */}
            <div className="dashboard-grid">
              <div className="skeleton-dashboard-card skeleton-shimmer">
                <div className="skeleton-card-header"></div>
                <div className="skeleton-chart"></div>
              </div>
              <div className="skeleton-dashboard-card skeleton-shimmer">
                <div className="skeleton-card-header"></div>
                <div className="skeleton-chart"></div>
              </div>
            </div>

            {/* Recent Items Skeleton */}
            <div className="dashboard-grid">
              <div className="skeleton-dashboard-card skeleton-shimmer">
                <div className="skeleton-card-header"></div>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton-booking-item"></div>
                ))}
              </div>
              <div className="skeleton-dashboard-card skeleton-shimmer">
                <div className="skeleton-card-header"></div>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton-activity-item"></div>
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* Loading Indicator */}
        <div className="loading-indicator">
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard-container">
      {/* Animated Background Elements */}
      <div className="bg-orb orb-1"></div>
      <div className="bg-orb orb-2"></div>
      <div className="bg-orb orb-3"></div>

      {/* Top Navigation */}
      <header className="admin-topbar">
        <div className="nav-left">
          <img src="/hyper.jpeg" alt="HyperMoth" className="logo-image" />
        </div>
        <div className="topbar-welcome">
          <h1>Admin Dashboard</h1>
        </div>
        <div className="nav-right">
          <button className="premium-menu-btn" onClick={handleMenuToggle}>
            <span className="menu-line-middle"></span>
          </button>
        </div>
      </header>

      {/* Premium Dropdown Menu */}
      {menuOpen && (
        <div className="premium-dropdown-overlay" onClick={() => setMenuOpen(false)}>
          <div className="premium-dropdown-menu" onClick={(e) => e.stopPropagation()}>
            <div className="premium-menu-header">
              <h3>Admin Menu</h3>
              <button className="premium-menu-close" onClick={() => setMenuOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="premium-menu-items">
              {menuItems.map((item, index) => (
                <button
                  key={index}
                  className="premium-menu-item"
                  onClick={() => handleMenuNavigation(item.path)}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </button>
              ))}
              <button className="premium-menu-item logout-item" onClick={handleLogout}>
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="admin-main">
        {/* Dashboard Content */}
        <div className="dashboard-content">
          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card stat-card-bookings">
              <div className="stat-icon">
                <Ticket size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-label">TOTAL BOOKINGS</div>
                <div className="stat-value">{stats.totalBookings.toLocaleString()}</div>
                <div className="stat-change positive">
                  <TrendingUp size={14} />
                  +{stats.growthRate}% vs last month
                </div>
              </div>
            </div>

            <div className="stat-card stat-card-users">
              <div className="stat-icon">
                <Users size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-label">TOTAL USERS</div>
                <div className="stat-value">{stats.totalUsers.toLocaleString()}</div>
                <div className="stat-change positive">
                  <TrendingUp size={14} />
                  +{stats.userGrowthRate}% vs last month
                </div>
              </div>
            </div>

            <div className="stat-card stat-card-events">
              <div className="stat-icon">
                <Calendar size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-label">ACTIVE EVENTS</div>
                <div className="stat-value">{stats.activeEvents}</div>
                <div className="stat-change positive">
                  <TrendingUp size={14} />
                  +{stats.eventGrowthRate}% vs last month
                </div>
              </div>
            </div>

            <div className="stat-card stat-card-growth">
              <div className="stat-icon">
                <TrendingUp size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-label">GROWTH RATE</div>
                <div className="stat-value">{stats.growthRate}%</div>
                <div className="stat-change positive">
                  <TrendingUp size={14} />
                  +{stats.growthRate}% vs last month
                </div>
              </div>
            </div>
          </div>

          {/* Revenue & Sales Section */}
          <div className="dashboard-grid">
            {/* Revenue Overview */}
            <div className="dashboard-card revenue-card">
              <div className="card-header">
                <h2>Revenue Overview</h2>
                <p>Monthly revenue and expense comparison</p>
              </div>
              <div className="revenue-stats">
                <div className="revenue-stat">
                  <div className="revenue-label">TOTAL REVENUE</div>
                  <div className="revenue-value">${stats.totalRevenue}K</div>
                </div>
                <div className="revenue-stat">
                  <div className="revenue-label">TOTAL EXPENSES</div>
                  <div className="revenue-value">${stats.totalExpenses}K</div>
                </div>
                <div className="revenue-stat highlight">
                  <div className="revenue-label">NET PROFIT</div>
                  <div className="revenue-value">${stats.netProfit}K</div>
                </div>
              </div>
              <div className="revenue-chart">
                <div className="chart-legend">
                  <div className="legend-item">
                    <span className="legend-dot revenue"></span>
                    <span>Revenue</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot expenses"></span>
                    <span>Expenses</span>
                  </div>
                </div>
                <div className="chart-area">
                  <svg viewBox="0 0 600 200" className="revenue-svg">
                    <defs>
                      <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgba(239, 68, 68, 0.3)" />
                        <stop offset="100%" stopColor="rgba(239, 68, 68, 0)" />
                      </linearGradient>
                      <linearGradient id="expensesGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgba(245, 158, 11, 0.3)" />
                        <stop offset="100%" stopColor="rgba(245, 158, 11, 0)" />
                      </linearGradient>
                    </defs>
                    {/* Revenue Area */}
                    <path
                      d="M 0 150 Q 75 120, 100 100 T 200 80 T 300 60 T 400 70 T 500 50 T 600 40 L 600 200 L 0 200 Z"
                      fill="url(#revenueGradient)"
                    />
                    <path
                      d="M 0 150 Q 75 120, 100 100 T 200 80 T 300 60 T 400 70 T 500 50 T 600 40"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="3"
                    />
                    {/* Expenses Area */}
                    <path
                      d="M 0 170 Q 75 160, 100 150 T 200 140 T 300 120 T 400 130 T 500 110 T 600 100 L 600 200 L 0 200 Z"
                      fill="url(#expensesGradient)"
                    />
                    <path
                      d="M 0 170 Q 75 160, 100 150 T 200 140 T 300 120 T 400 130 T 500 110 T 600 100"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="3"
                    />
                  </svg>
                  <div className="chart-labels">
                    <span>Jan</span>
                    <span>Feb</span>
                    <span>Mar</span>
                    <span>Apr</span>
                    <span>May</span>
                    <span>Jun</span>
                    <span>Jul</span>
                    <span>Aug</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly Sales */}
            <div className="dashboard-card sales-card">
              <div className="card-header">
                <h2>Weekly Sales</h2>
              </div>
              <div className="weekly-revenue">
                <div className="weekly-label">THIS WEEK</div>
                <div className="weekly-value">${stats.weeklyRevenue.toLocaleString()}</div>
              </div>
              <div className="sales-chart">
                {weeklySales.map((day, index) => {
                  const maxSale = Math.max(...weeklySales.map(d => d.amount))
                  const height = (day.amount / maxSale) * 100
                  return (
                    <div key={index} className="sales-bar-container">
                      <div className="sales-bar" style={{ height: `${height}%` }}>
                        <div className="sales-bar-fill"></div>
                      </div>
                      <div className="sales-label">{day.day}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Recent Bookings & Activity */}
          <div className="dashboard-grid">
            {/* Recent Bookings */}
            <div className="dashboard-card bookings-card">
              <div className="card-header">
                <h2>Recent Bookings</h2>
                <button className="view-all-btn" onClick={() => navigate('/admin/dashboard/bookings')}>
                  View All
                  <ChevronRight size={16} />
                </button>
              </div>
              <div className="bookings-list">
                {recentBookings.length === 0 ? (
                  <div className="empty-bookings">
                    <Ticket size={48} />
                    <p>No recent bookings</p>
                  </div>
                ) : (
                  recentBookings.map((booking) => (
                    <div key={booking.id} className="booking-item">
                      <div className="booking-icon">
                        <Calendar size={20} />
                      </div>
                      <div className="booking-info">
                        <div className="booking-title">{booking.events?.title || 'Unknown Event'}</div>
                        <div className="booking-meta">
                          <span className="booking-user">{booking.user?.email || 'N/A'}</span>
                          <span className="booking-venue">{booking.events?.location || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="booking-price">${booking.total_price}</div>
                      <div className={`booking-status ${booking.status}`}>
                        {booking.status === 'confirmed' ? 'Confirmed' : 
                         booking.status === 'checked_in' ? 'Checked In' : 'Pending'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Activity Feed */}
            <div className="dashboard-card activity-card">
              <div className="card-header">
                <h2>Activity Feed</h2>
              </div>
              <div className="activity-list">
                {activities.map((activity, index) => (
                  <div key={index} className="activity-item">
                    <div className={`activity-icon ${activity.type}`}>
                      {activity.icon === 'user' && <UserCircle size={16} />}
                      {activity.icon === 'booking' && <Ticket size={16} />}
                      {activity.icon === 'event' && <Calendar size={16} />}
                    </div>
                    <div className="activity-content">
                      <div className="activity-message">{activity.message}</div>
                      <div className="activity-time">{activity.time}</div>
                    </div>
                    <button className="activity-action">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
