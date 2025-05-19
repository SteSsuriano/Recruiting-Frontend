function LoginForm({ userType }) {
  return (
    <div style={{ marginTop: '2rem' }}>
      <h3>Login per {userType}</h3>
      <form>
        <input type="email" placeholder="Email" required style={{ display: 'block', margin: '0.5rem auto' }} />
        <input type="password" placeholder="Password" required style={{ display: 'block', margin: '0.5rem auto' }} />
        <button type="submit">Accedi</button>
      </form>
    </div>
  )
}

export default LoginForm
