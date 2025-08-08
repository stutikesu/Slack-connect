import { createContext, useState, useEffect, ReactNode } from 'react'
import axios from 'axios'

interface Workspace {
  workspace_id: string
  workspace_name: string
}

interface WorkspaceContextType {
  workspaces: Workspace[]
  selectedWorkspace: Workspace | null
  loading: boolean
  error: string | null
  fetchWorkspaces: () => Promise<void>
  selectWorkspace: (workspace: Workspace) => void
  disconnectWorkspace: (workspaceId: string) => Promise<void>
}

export const WorkspaceContext = createContext<WorkspaceContextType>({
  workspaces: [],
  selectedWorkspace: null,
  loading: false,
  error: null,
  fetchWorkspaces: async () => {},
  selectWorkspace: () => {},
  disconnectWorkspace: async () => {}
})

interface WorkspaceProviderProps {
  children: ReactNode
}

export const WorkspaceProvider = ({ children }: WorkspaceProviderProps) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch workspaces from the API
  const fetchWorkspaces = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await axios.get('/api/auth/workspaces')
      setWorkspaces(response.data.workspaces)

      // If there's at least one workspace and none is selected, select the first one
      if (response.data.workspaces.length > 0 && !selectedWorkspace) {
        setSelectedWorkspace(response.data.workspaces[0])
      }
    } catch (err) {
      setError('Failed to fetch workspaces')
      console.error('Error fetching workspaces:', err)
    } finally {
      setLoading(false)
    }
  }

  // Select a workspace
  const selectWorkspace = (workspace: Workspace) => {
    setSelectedWorkspace(workspace)
  }

  // Disconnect a workspace
  const disconnectWorkspace = async (workspaceId: string) => {
    setLoading(true)
    setError(null)

    try {
      await axios.delete(`/api/auth/workspace/${workspaceId}`)
      
      // Remove the workspace from the list
      setWorkspaces(workspaces.filter(w => w.workspace_id !== workspaceId))
      
      // If the disconnected workspace was selected, select another one if available
      if (selectedWorkspace?.workspace_id === workspaceId) {
        const remainingWorkspaces = workspaces.filter(w => w.workspace_id !== workspaceId)
        setSelectedWorkspace(remainingWorkspaces.length > 0 ? remainingWorkspaces[0] : null)
      }
    } catch (err) {
      setError('Failed to disconnect workspace')
      console.error('Error disconnecting workspace:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch workspaces on component mount
  useEffect(() => {
    fetchWorkspaces()
  }, [])

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        selectedWorkspace,
        loading,
        error,
        fetchWorkspaces,
        selectWorkspace,
        disconnectWorkspace
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}