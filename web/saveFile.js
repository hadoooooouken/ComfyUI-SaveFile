import { app } from '../../scripts/app.js'

app.registerExtension({
  name: 'Comfy.SaveFile',

  commands: [
    {
      id: 'Comfy.SaveFileToDisk',
      label: 'Save File\u2026',
      menubarLabel: 'Save File\u2026',
      icon: 'pi pi-save',
      async function () {
        const workflow = app.extensionManager?.workflow?.activeWorkflow
        const p = await app.graphToPrompt()

        // Preserve canvas view state if enabled
        try {
          const enableRestore =
            app.ui?.settings?.getSettingValue(
              'Comfy.EnableWorkflowViewRestore'
            ) ?? false
          if (enableRestore) {
            const { offset, scale } = app.canvas.ds
            const [x, y] = offset
            p.workflow.extra = p.workflow.extra || {}
            p.workflow.extra.ds = { scale, offset: [x, y] }
          }
        } catch (_) {
          // Ignore if settings not available
        }

        const json = JSON.stringify(p.workflow, null, 2)
        const suggestedName = workflow?.filename ?? 'workflow.json'

        // Use File System Access API if available (Chrome, Edge, Electron)
        if ('showSaveFilePicker' in window) {
          try {
            const handle = await window.showSaveFilePicker({
              suggestedName,
              types: [
                {
                  description: 'JSON Files',
                  accept: { 'application/json': ['.json'] }
                }
              ]
            })
            const writable = await handle.createWritable()
            await writable.write(json)
            await writable.close()
          } catch (err) {
            // User cancelled the dialog
            if (err.name === 'AbortError') return
            throw err
          }
        } else {
          // Fallback: trigger a browser download
          const blob = new Blob([json], { type: 'application/json' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = suggestedName
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        }
      }
    }
  ],

  menuCommands: [
    {
      path: ['File'],
      commands: ['Comfy.SaveFileToDisk']
    }
  ]
})
