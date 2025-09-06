from playwright.sync_api import sync_playwright, expect

def run_verification(playwright):
    """
    This script verifies the basic game loop of Reality Check.
    1. Creates a game with one player.
    2. Starts the game.
    3. Takes a screenshot of the initial game state.
    4. Simulates a player action (making a card choice).
    5. Takes a screenshot of the game state after the action.
    """
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Navigate to the game
        page.goto("http://localhost:5000")

        # --- Create a Game ---
        # Enter username and game name
        page.get_by_placeholder("Enter your username").fill("Tester")
        page.get_by_placeholder("Game name (for creating)").fill("Test Game")

        # Click the create game button
        page.get_by_role("button", name="Create New Game").click()

        # Wait for the game area to be visible, indicating success
        expect(page.locator("#gameArea")).to_be_visible(timeout=10000)
        print("Game created successfully.")

        # --- Start the Game ---
        # The creator is automatically the first player
        page.get_by_role("button", name="Start Game").click()

        # Wait for the game status to update
        expect(page.locator("#gameStatus")).to_have_text("Game started! Round 1", timeout=5000)
        print("Game started successfully.")

        # Take a screenshot of the initial game state
        page.screenshot(path="jules-scratch/verification/01_game_started.png")
        print("Screenshot 1: Game started.")

        # --- Simulate a Player Action ---
        # In a real game, cards would be presented. For now, we'll assume
        # the game is in a state where a choice can be made.
        # The client-side code in public/game.js has a function makeCardChoice.
        # We can call it directly to simulate a choice.
        page.evaluate("makeCardChoice('test_card', 0)")
        print("Simulated card choice.")

        # Wait for the card resolution message to appear
        expect(page.locator(".card-result")).to_be_visible(timeout=5000)
        print("Card choice resolved.")

        # Take a screenshot of the state after the choice
        page.screenshot(path="jules-scratch/verification/02_after_choice.png")
        print("Screenshot 2: After card choice.")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run_verification(playwright)
