import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import PrivateRoute from './components/PrivateRoute'
import Admin from './pages/Admin'
import Home from './pages/Home'
import { ToastContainer, Slide } from 'react-toastify'
import ArticleDetail from './pages/Article'
import AdminClankyScreen from './components/AdminClankyScreen'
import AdminClanky from './pages/AdminClanky'

function App() {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <Admin />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin-clanky"
          element={
            <PrivateRoute>
              <AdminClanky />
            </PrivateRoute>
          }
        />
        <Route
          path="/edit-article/:slug"
          element={
            <PrivateRoute>
              <Admin />
            </PrivateRoute>
          }
        />
        <Route path='/article/:slug' element={<ArticleDetail />} />
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        transition={Slide}
      />
    </Router>
  )
}

export default App
