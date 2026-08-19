import { AppProvider, useApp } from './state/AppContext'
import { Layout } from './components/Layout'
import { NuevaIdea } from './pages/NuevaIdea'
import { Conceptos } from './pages/Conceptos'
import { Variantes } from './pages/Variantes'
import { Programacion } from './pages/Programacion'
import { ConfiguracionIA } from './pages/ConfiguracionIA'

function Pantalla() {
  const { vista } = useApp()
  switch (vista) {
    case 'conceptos':
      return <Conceptos />
    case 'variantes':
      return <Variantes />
    case 'programacion':
      return <Programacion />
    case 'ai':
      return <ConfiguracionIA />
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