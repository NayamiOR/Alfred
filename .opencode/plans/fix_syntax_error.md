# Plan - Fix Syntax Error in App.vue

## Goal
Resolve the `Unexpected token` error in `src/App.vue` caused by duplicated code blocks during the previous editing session.

## Steps
1. Remove redundant `unlistenDragLeave` and `unlistenDrop` assignments that appear after the first `onMounted` closing brace.
2. Ensure the `onMounted` block is closed exactly once after all listeners are initialized.
3. Verify that `onUnmounted` follows correctly.

## Proposed Code Correction
The section between the end of the first valid `unlistenDrop` and the start of `onUnmounted` should be cleaned up from:
```typescript
  });
});

  unlistenDragLeave = await appWindow.listen('tauri://drag-leave', () => {
    libraryStore.ui.dragState.isDragging = false;
  });

  unlistenDrop = await appWindow.listen('tauri://drag-drop', (event) => {
    libraryStore.ui.dragState.isDragging = false;
    if (canDrop.value) {
      const payload = event.payload as { paths: string[] };
      if (payload.paths && payload.paths.length > 0) {
        actions.addFiles(payload.paths);
      }
    }
  });
});
```
To simply:
```typescript
  });
});
```
