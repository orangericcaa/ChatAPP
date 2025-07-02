import sqlite3
from threading import Lock

db_lock = Lock()

def init(db_path):
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            cursor = db_conn.cursor()
            # 用户表
            cursor.execute('''CREATE TABLE IF NOT EXISTS UserTable (
                email TEXT PRIMARY KEY,
                username TEXT NOT NULL,
                pwdhash TEXT NOT NULL
            )''')
            # 好友表
            cursor.execute('''CREATE TABLE IF NOT EXISTS FriendTable (
                user1 TEXT NOT NULL,
                user2 TEXT NOT NULL,
                FOREIGN KEY(user1) REFERENCES UserTable(email) ON DELETE CASCADE,
                FOREIGN KEY(user2) REFERENCES UserTable(email) ON DELETE CASCADE
            )''')
            # 好友请求表
            cursor.execute('''CREATE TABLE IF NOT EXISTS FriendRequest (
                inviter TEXT NOT NULL,
                invitee TEXT NOT NULL,
                time FLOAT NOT NULL,
                FOREIGN KEY(inviter) REFERENCES UserTable(email) ON DELETE CASCADE,
                FOREIGN KEY(invitee) REFERENCES UserTable(email) ON DELETE CASCADE
            )''')
            # 聊天消息表
            cursor.execute('''CREATE TABLE IF NOT EXISTS MessageTable (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sender TEXT NOT NULL,
                receiver TEXT NOT NULL,
                content TEXT NOT NULL,
                timestamp FLOAT NOT NULL,
                type TEXT DEFAULT 'text'
            )''')
            # 视频会话表
            cursor.execute('''CREATE TABLE IF NOT EXISTS VideoSession (
                session_id TEXT PRIMARY KEY,
                initiator TEXT NOT NULL,
                participant TEXT NOT NULL,
                status TEXT NOT NULL,
                FOREIGN KEY(initiator) REFERENCES UserTable(email) ON DELETE CASCADE,
                FOREIGN KEY(participant) REFERENCES UserTable(email) ON DELETE CASCADE
            )''')
            db_conn.commit()

# 用户相关
def find_user(db_path, email):
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            cursor = db_conn.cursor()
            cursor.execute("SELECT username FROM UserTable WHERE email=?", (email,))
            row = cursor.fetchone()
            return row[0] if row else None

def get_pwdhash(db_path, email):
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            cursor = db_conn.cursor()
            cursor.execute("SELECT pwdhash FROM UserTable WHERE email=?", (email,))
            row = cursor.fetchone()
            return row[0] if row else None

def register_user(db_path, email, username, pwdhash):
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            db_conn.execute("INSERT INTO UserTable (email, username, pwdhash) VALUES (?, ?, ?)", (email, username, pwdhash))
            db_conn.commit()

def update_user_name(db_path, email, new_name):
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            db_conn.execute("UPDATE UserTable SET username=? WHERE email=?", (new_name, email))
            db_conn.commit()

# 好友相关
def raise_friend_request(db_path, inviter, invitee):
    import time
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            db_conn.execute("INSERT INTO FriendRequest (inviter, invitee, time) VALUES (?, ?, ?)", (inviter, invitee, time.time()))
            db_conn.commit()

def get_friend_request(db_path, email):
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            cursor = db_conn.cursor()
            cursor.execute("SELECT inviter FROM FriendRequest WHERE invitee=?", (email,))
            requests = [row[0] for row in cursor.fetchall()]
            db_conn.execute("DELETE FROM FriendRequest WHERE invitee=?", (email,))
            db_conn.commit()
            return requests

def add_friend(db_path, user1, user2):
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            db_conn.execute("INSERT INTO FriendTable (user1, user2) VALUES (?, ?)", (user1, user2))
            db_conn.execute("INSERT INTO FriendTable (user1, user2) VALUES (?, ?)", (user2, user1))
            db_conn.commit()

def get_friend_list(db_path, email):
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            cursor = db_conn.cursor()
            cursor.execute("SELECT user2 FROM FriendTable WHERE user1=?", (email,))
            friends = [row[0] for row in cursor.fetchall()]
            # 获取好友昵称
            result = []
            for f in friends:
                cursor.execute("SELECT username FROM UserTable WHERE email=?", (f,))
                row = cursor.fetchone()
                result.append((f, row[0] if row else ""))
            return result

def judge_friend(db_path, user1, user2):
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            cursor = db_conn.cursor()
            cursor.execute("SELECT 1 FROM FriendTable WHERE user1=? AND user2=?", (user1, user2))
            return cursor.fetchone() is not None

def del_friend(db_path, user1, user2):
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            db_conn.execute("DELETE FROM FriendTable WHERE (user1=? AND user2=?) OR (user1=? AND user2=?)", (user1, user2, user2, user1))
            db_conn.commit()

# 聊天消息相关
def save_message(db_path, sender, receiver, content, timestamp, msg_type="text"):
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            db_conn.execute(
                "INSERT INTO MessageTable (sender, receiver, content, timestamp, type) VALUES (?, ?, ?, ?, ?)",
                (sender, receiver, content, timestamp, msg_type)
            )
            db_conn.commit()

def get_messages(db_path, user1, user2, limit=100):
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            cursor = db_conn.cursor()
            cursor.execute(
                '''SELECT sender, receiver, content, timestamp, type FROM MessageTable
                   WHERE (sender=? AND receiver=?) OR (sender=? AND receiver=?)
                   ORDER BY timestamp DESC LIMIT ?''',
                (user1, user2, user2, user1, limit)
            )
            return cursor.fetchall()[::-1]  # 正序返回

# 视频会话相关
def create_video_session(db_path, session_id, initiator, participant):
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            db_conn.execute(
                "INSERT INTO VideoSession (session_id, initiator, participant, status) VALUES (?, ?, ?, ?)",
                (session_id, initiator, participant, "pending")
            )
            db_conn.commit()

def update_video_session_status(db_path, session_id, status):
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            db_conn.execute(
                "UPDATE VideoSession SET status=? WHERE session_id=?",
                (status, session_id)
            )
            db_conn.commit()

def get_video_session(db_path, session_id):
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            cursor = db_conn.cursor()
            cursor.execute(
                "SELECT session_id, initiator, participant, status FROM VideoSession WHERE session_id=?",
                (session_id,)
            )
            return cursor.fetchone()
