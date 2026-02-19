import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import { Users, Calendar, Ticket, DollarSign, TrendingUp, Activity } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function AdminDashboard() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEvents: 0,
    totalBookings: 0,
    totalRevenue: 0
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [topEvents, setTopEvents] = useState([])
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
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    try {
      // Fetch stats
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      const { count: eventsCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })

      const { data: bookingsData, count: bookingsCount } = await supabase
        .from('bookings')
        .select('total_price', { count: 'exact' })

      const totalRevenue = bookingsData?.reduce((sum, b) => sum + (parseFloat(b.total_price) || 0), 0) || 0

      setStats({
        totalUsers: usersCount || 0,
        totalEvents: eventsCount || 0,
        totalBookings: bookingsCount || 0,
        totalRevenue: totalRevenue.toFixed(2)
      })

      // Fetch recent bookings for activity
      const { data: recentBookings } = await supabase
        .from('bookings')
        .select('*, profiles(name, email), events(title)')
        .order('created_at', { ascending: false })
        .limit(5)

      setRecentActivity(recentBookings || [])

      // Fetch top events
      const { data: eventsWithBookings } = await supabase
        .from('events')
        .select('*, bookings(quantity, total_price)')

      const eventsStats = eventsWithBookings?.map(event => ({
        name: event.title,
        bookings: event.bookings?.reduce((sum, b) => sum + b.quantity, 0) || 0,
        revenue: event.bookings?.reduce((sum, b) => sum + parseFloat(b.total_price || 0), 0) || 0
      })) || []

      const sortedEvents = eventsStats.sort((a, b) => b.revenue - a.revenue).slice(0, 4)
      setTopEvents(sortedEvents)

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  const statsDisplay = [
    { icon: Users, label: 'Total Users', value: stats.totalUsers, change: '+12%', color: 'from-blue-500 to-blue-600' },
    { icon: Calendar, label: 'Active Events', value: stats.totalEvents, change: '+8%', color: 'from-purple-500 to-purple-600' },
    { icon: Ticket, label: 'Total Bookings', value: stats.totalBookings, change: '+23%', color: 'from-green-500 to-green-600' },
    { icon: DollarSign, label: 'Revenue', value: `$${stats.totalRevenue}`, change: '+15%', color: 'from-orange-500 to-orange-600' }
  ]

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isAdmin={true} />
      
      <main className="flex-1 lg:ml-0 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 mt-16 lg:mt-0">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-600">Monitor and manage your event platform</p>
          </div>

          {loadingData ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                {statsDisplay.map((stat, index) => (
                  <div key={index} className="card">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center`}>
                        <stat.icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-green-600 text-sm font-semibold flex items-center">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        {stat.change}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Recent Activity */}
                <div className="card">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold flex items-center">
                      <Activity className="w-5 h-5 mr-2" />
                      Recent Activity
                    </h2>
                  </div>
                  {recentActivity.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No recent activity</p>
                  ) : (
                    <div className="space-y-4">
                      {recentActivity.map((activity, index) => (
                        <div key={index} className="flex items-start space-x-3 pb-4 border-b last:border-b-0">
                          <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-semibold">
                              {activity.profiles?.name?.[0] || 'U'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{activity.profiles?.name || 'User'}</p>
                            <p className="text-sm text-gray-600">Booked {activity.events?.title}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(activity.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Top Events */}
                <div className="card">
                  <h2 className="text-xl font-bold mb-6">Top Performing Events</h2>
                  {topEvents.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No events data available</p>
                  ) : (
                    <div className="space-y-4">
                      {topEvents.map((event, index) => (
                        <div key={index} className="flex items-center justify-between pb-4 border-b last:border-b-0">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{event.name}</p>
                            <p className="text-sm text-gray-600">{event.bookings} bookings</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">${event.revenue.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="card">
                <h2 className="text-xl font-bold mb-6">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button className="btn-primary">Create Event</button>
                  <button className="btn-secondary">View All Users</button>
                  <button className="btn-secondary">Export Reports</button>
                  <button className="btn-secondary">Settings</button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
