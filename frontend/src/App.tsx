import { AppProvider, useApp } from './state/AppContext'
import { Layout } from './components/Layout'
import { NuevaIdea } from './pages/NuevaIdea'
import { Variantes } from './pages/Variantes'
import { Programacion } from './pages/Programacion'

function Pantalla() {
  const { vista } = useApp()
  switch (vista) {
    case 'variantes':
      return <Variantes />
    case 'programacion':
      return <Programacion />
    default:
      return <NuevaIdea />
  }
}

export default function App() {
  return (
    <AppProvider>
      <Layout>
        <Pantalla />
      </Layout>
    </AppProvider>
  )
}