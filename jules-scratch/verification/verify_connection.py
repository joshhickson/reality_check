from playwright.sync_api import sync_playwright, expect

def run_verification(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    try:
        print("Navigating to page...")
        page.goto("http://localhost:5000")
        print("Navigation successful.")
        # Just check for the title to confirm the page loaded
        expect(page).to_have_title("Reality Check - The Game")
        print("Title verified.")
        page.screenshot(path="jules-scratch/verification/connection_verified.png")
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run_verification(playwright)
