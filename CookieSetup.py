import asyncio
from twikit import Client

USERNAME = 'Hamhunter23'
EMAIL = 'aimemes0106@gmail.com'
PASSWORD = 'P9pNY7JmfX'

# Initialize client
client = Client('en-US')

async def main():
    await client.login(
        auth_info_1=USERNAME,
        auth_info_2=EMAIL,
        password=PASSWORD,
        cookies_file='cookies.json'
    )

    client.save_cookies('cookies.json')

    print("Login successful")
    print("Cookies saved to cookies.json")

asyncio.run(main())
