import React from 'react'
import { Users, CreditCard, Cpu, MapPin, Clock, Shield, FileText } from 'lucide-react'
import Layout from '../../components/Layout'

const navItems = [
  { to: '/client/employees', label: 'Employees', icon: Users },
  { to: '/client/cards', label: 'Cards', icon: CreditCard },
  { to: '/client/readers', label: 'Readers', icon: Cpu },
  { to: '/client/zones', label: 'Zones', icon: MapPin },
  { to: '/client/schedules', label: 'Schedules', icon: Clock },
  { to: '/client/access-rules', label: 'Access Rules', icon: Shield },
  { to: '/client/logs', label: 'Access Logs', icon: FileText },
]

export default function ClientLayout() {
  return <Layout navItems={navItems} />
}
