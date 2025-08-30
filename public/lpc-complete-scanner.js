/**
 * Triggers the server to scan the LPC spritesheet directory and generate a comprehensive JSON database.
 * Provides user feedback during the process.
 */
async function generateSpriteDatabase() {
  const button = document.getElementById('generate-db-button');
  const status = document.getElementById('db-status');

  if (button) {
    button.disabled = true;
    button.textContent = 'Generating...';
  }
  if (status) status.textContent = 'Scanning file system and generating database... please wait. This may take a moment.';

  try {
    // This endpoint now handles scanning, processing, and saving the file.
    const response = await fetch('/api/scan-lpc-files');
    const result = await response.json();

    if (response.ok) {
      if (status) {
        status.innerHTML = `✅ Success! ${result.message}<br>The page will now reload to use the new data.`;
      }
      console.log('Database generation successful:', result);

      // Notify the user and reload to apply the new database.
      alert('Sprite database has been successfully generated! The page will now reload.');
      window.location.reload();

    } else {
      // If the server returned an error, display it.
      throw new Error(result.error || 'An unknown error occurred on the server.');
    }
  } catch (error) {
    const errorMessage = `Error: ${error.message}`;
    if (status) status.textContent = `❌ ${errorMessage}`;
    console.error('Database generation failed:', error);
    alert(`Failed to generate sprite database. See console for details.`);

    if (button) {
      button.textContent = 'Generate Sprite Database';
    }
  } finally {
    // Re-enable the button in case of failure. On success, the page reloads.
    if (button) {
      button.disabled = false;
    }
  }
}
