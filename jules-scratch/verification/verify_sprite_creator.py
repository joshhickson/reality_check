from playwright.sync_api import sync_playwright, Page, expect

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()

    # 1. Arrange: Go to the sprite creator page.
    page.goto("http://localhost:5000/sprite-creator.html", timeout=60000)

    # 2. Assert: Check that the database is loaded by looking for populated dropdowns.
    body_select = page.locator("#bodySelect")
    expect(body_select.locator("option")).to_have_count(86, timeout=60000)
    expect(body_select).to_be_visible()

    # 3. Screenshot: Capture the final result for visual verification.
    page.screenshot(path="jules-scratch/verification/verification.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
