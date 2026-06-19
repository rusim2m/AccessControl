import React from 'react'
import { Users, Building2, Cpu } from 'lucide-react'
import Layout from '../../components/Layout'

const navItems = [
  { to: '/admin/dealers', label: 'Manage Dealers', icon: Users },
  { to: '/admin/organizations', label: 'Organizations', icon: Building2 },
  { to: '/admin/devices', label: 'Device Inventory', icon: Cpu },
]

export default function AdminLayout() {
  return <Layout navItems={navItems} />
}
