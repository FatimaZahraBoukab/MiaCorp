"use client"

import { Outlet } from "react-router-dom"
import Sidebar from "./Sidebar"
import Header from "./Header"
import "../styles/client.css"

const ClientLayout = () => {
  return (
    <div className="app-container8">
      <Sidebar />
      <div className="main-content8">
        <Header />
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default ClientLayout
