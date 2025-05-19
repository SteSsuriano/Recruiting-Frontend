import { useState } from 'react'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'
import './Home.css'

function Home() {
  const [userType, setUserType] = useState('candidato')
  const [confirmed, setConfirmed] = useState(false)
  const [view, setView] = useState('login')

  if (!confirmed) {
    return (
      <div className="container">
        <h1 className="title">GoJob!</h1>
        <div className="box">
          <h2>Benvenuto/a! <br /> Scegli il tipo di utente:</h2>
          
          <label className="switch">
            <input
              type="checkbox"
              checked={userType === 'azienda'}
              onChange={() =>
                setUserType((prev) => (prev === 'candidato' ? 'azienda' : 'candidato'))
              }
            />
            <span className={`slider ${userType === 'azienda' ? 'azienda-active' : 'candidato-active'}`}>
              <span className="slider-thumb">{userType === 'candidato' ? 'Candidato' : 'Azienda'}</span>
            </span>
            <span className="slider-text left">Candidato</span>
            <span className="slider-text right">Azienda</span>
          </label>
          
          <button className="confirm-btn" onClick={() => setConfirmed(true)}>
            Conferma
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <h1 className="title">GoJob!</h1>
      <div className="box">
        <h2>{userType === 'candidato' ? 'Candidato' : 'Azienda'} selezionato</h2>
        
        <div className="btn-group">
          <button
            className={view === 'login' ? 'tab-btn active' : 'tab-btn'}
            onClick={() => setView('login')}
          >
            Login
          </button>
          <button
            className={view === 'register' ? 'tab-btn active' : 'tab-btn'}
            onClick={() => setView('register')}
          >
            Registrati
          </button>
          <button className="back-btn" onClick={() => setConfirmed(false)}>
            ← Indietro
          </button>
        </div>
        
        <div className="form-container">
          {view === 'login' && <LoginForm userType={userType} />}
          {view === 'register' && <RegisterForm userType={userType} />}
        </div>
      </div>
    </div>
  )
}

export default Home