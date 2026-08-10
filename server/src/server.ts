import 'dotenv/config'
import app from './app'

const PORT = Number(process.env.PORT) || 3000

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 cocktail-server listening on http://0.0.0.0:${PORT}`)
  console.log(`   health: http://localhost:${PORT}/api/health`)
})
