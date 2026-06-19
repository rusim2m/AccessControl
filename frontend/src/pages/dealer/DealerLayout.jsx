import React from 'react'
import { Building2, Cpu, Users } from 'lucide-react'
import Layout from '../../components/Layout'

const navItems = [
  { to: '/dealer/organizations', label: 'My Organizations', icon: Building2 },
  { to: '/dealer/clients', label: 'Clients', icon: Users },
  { to: '/dealer/devices', label: 'Devices', icon: Cpu },
]

export default function DealerLayout() {
  return <Layout navItems={navItems} />
}
