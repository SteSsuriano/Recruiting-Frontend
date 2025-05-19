function RegisterForm({ userType }) {
  return (
    <div style={{ marginTop: '2rem' }}>
      <h3>Registrazione per {userType}</h3>
      <form>
        <input type="text" placeholder="Nome" required style={{ display: 'block', margin: '0.5rem auto' }} />
        <input type="text" placeholder="Cognome" required style={{ display: 'block', margin: '0.5rem auto' }} />
        <input type="email" placeholder="Email" required style={{ display: 'block', margin: '0.5rem auto' }} />
        <input type="password" placeholder="Password" required style={{ display: 'block', margin: '0.5rem auto' }} />
        <button type="submit">Registrati</button>
      </form>
    </div>
  )
}

export default RegisterForm
