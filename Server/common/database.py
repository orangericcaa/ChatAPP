import sqlite3
from threading import Lock
import time

db_lock = Lock()

def init(db_path):
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            cursor = db_conn.cursor()
            # 用户表
            cursor.execute('''CREATE TABLE IF NOT EXISTS UserTable (
                email TEXT PRIMARY KEY,
                username TEXT NOT NULL,
                pwdhash TEXT NOT NULL,
                avatar TEXT DEFAULT '',
                created_at FLOAT DEFAULT 0,
                last_login FLOAT DEFAULT 0,
                status TEXT DEFAULT 'offline'
            )''')
            # 好友表
            cursor.execute('''CREATE TABLE IF NOT EXISTS FriendTable (
                user1 TEXT NOT NULL,
                user2 TEXT NOT NULL,
                created_at FLOAT DEFAULT 0,
                FOREIGN KEY(user1) REFERENCES UserTable(email) ON DELETE CASCADE,
                FOREIGN KEY(user2) REFERENCES UserTable(email) ON DELETE CASCADE
            )''')
            # 好友请求表
            cursor.execute('''CREATE TABLE IF NOT EXISTS FriendRequest (
                inviter TEXT NOT NULL,
                invitee TEXT NOT NULL,
                time FLOAT NOT NULL,
                status TEXT DEFAULT 'pending',
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
                type TEXT DEFAULT 'text',
                is_read BOOLEAN DEFAULT 0
            )''')
            # 视频会话表 - 增强功能
            cursor.execute('''CREATE TABLE IF NOT EXISTS VideoSession (
                session_id TEXT PRIMARY KEY,
                caller TEXT NOT NULL,
                callee TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                start_time FLOAT,
                end_time FLOAT,
                duration INTEGER DEFAULT 0,
                created_at FLOAT DEFAULT 0,
                FOREIGN KEY(caller) REFERENCES UserTable(email) ON DELETE CASCADE,
                FOREIGN KEY(callee) REFERENCES UserTable(email) ON DELETE CASCADE
            )''')
            # 通知表
            cursor.execute('''CREATE TABLE IF NOT EXISTS NotificationTable (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_email TEXT NOT NULL,
                title TEXT DEFAULT '',
                content TEXT NOT NULL,
                type TEXT DEFAULT 'info',
                is_read BOOLEAN DEFAULT 0,
                created_at FLOAT DEFAULT 0,
                FOREIGN KEY(user_email) REFERENCES UserTable(email) ON DELETE CASCADE
            )''')
            # 用户设置表
            cursor.execute('''CREATE TABLE IF NOT EXISTS UserSettings (
                user_email TEXT PRIMARY KEY,
                notification_enabled BOOLEAN DEFAULT 1,
                sound_enabled BOOLEAN DEFAULT 1,
                FOREIGN KEY(user_email) REFERENCES UserTable(email) ON DELETE CASCADE
            )''')
            # 新增：通话质量反馈表
            cursor.execute('''CREATE TABLE IF NOT EXISTS CallQualityFeedback (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                user_email TEXT NOT NULL,
                rating INTEGER CHECK(rating >= 1 AND rating <= 5),
                feedback TEXT DEFAULT '',
                created_at FLOAT DEFAULT 0,
                FOREIGN KEY(session_id) REFERENCES VideoSession(session_id) ON DELETE CASCADE,
                FOREIGN KEY(user_email) REFERENCES UserTable(email) ON DELETE CASCADE
            )''')
            db_conn.commit()

# ================= 用户相关 =================

def find_user(db_path, email):
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            cursor = db_conn.cursor()
            cursor.execute("SELECT email, username, avatar, created_at, last_login, status FROM UserTable WHERE email=?", (email,))
            row = cursor.fetchone()
            if row:
                return {
                    "email": row[0], 
                    "name": row[1], 
                    "avatar": row[2] if row[2] else "",
                    "created_at": row[3] if row[3] else 0,
                    "last_login": row[4] if row[4] else 0,
                    "status": row[5] if row[5] else "offline"
                }
            else:
                return None

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
            current_time = time.time()
            db_conn.execute(
                "INSERT INTO UserTable (email, username, pwdhash, created_at, last_login) VALUES (?, ?, ?, ?, ?)", 
                (email, username, pwdhash, current_time, current_time)
            )
            # 创建用户默认设置
            db_conn.execute(
                "INSERT INTO UserSettings (user_email) VALUES (?)",
                (email,)
            )
            db_conn.commit()

def update_user_name(db_path, email, new_name):
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            db_conn.execute("UPDATE UserTable SET username=? WHERE email=?", (new_name, email))
            db_conn.commit()

def get_username(db_path, email):
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            cursor = db_conn.cursor()
            cursor.execute("SELECT username FROM UserTable WHERE email=?", (email,))
            row = cursor.fetchone()
            return row[0] if row else None

def update_avatar(db_path, email, avatar_url):
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            db_conn.execute("UPDATE UserTable SET avatar=? WHERE email=?", (avatar_url, email))
            db_conn.commit()

def update_user_info(db_path, email, name):
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            db_conn.execute("UPDATE UserTable SET username=? WHERE email=?", (name, email))
            db_conn.commit()

def search_users(db_path, keyword, limit=20):
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            cursor = db_conn.cursor()
            like_kw = f"%{keyword}%"
            cursor.execute(
                "SELECT email, username, avatar FROM UserTable WHERE email LIKE ? OR username LIKE ? LIMIT ?", 
                (like_kw, like_kw, limit)
            )
            return [{"email": row[0], "name": row[1], "avatar": row[2] if row[2] else ""} for row in cursor.fetchall()]

def get_user_status(db_path, email):
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            cursor = db_conn.cursor()
            cursor.execute("SELECT status FROM UserTable WHERE email=?", (email,))
            row = cursor.fetchone()
            return row[0] if row else "offline"

def update_user_status(db_path, email, status):
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            db_conn.execute(
                "UPDATE UserTable SET status=?, last_login=? WHERE email=?", 
                (status, time.time(), email)
            )
            db_conn.commit()

def get_user_last_seen(db_path, email):
    """获取用户最后在线时间"""
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            cursor = db_conn.cursor()
            cursor.execute("SELECT last_login, status FROM UserTable WHERE email=?", (email,))
            row = cursor.fetchone()
            if row:
                return {
                    "last_login": row[0],
                    "status": row[1],
                    "is_online": row[1] == "online"
                }
            return None

def batch_update_user_status(db_path, users_status):
    """批量更新用户状态"""
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            current_time = time.time()
            for email, status in users_status.items():
                db_conn.execute(
                    "UPDATE UserTable SET status=?, last_login=? WHERE email=?",
                    (status, current_time, email)
                )
            db_conn.commit()

# ================= 好友相关 =================

def raise_friend_request(db_path, inviter, invitee):
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            db_conn.execute(
                "INSERT INTO FriendRequest (inviter, invitee, time) VALUES (?, ?, ?)", 
                (inviter, invitee, time.time())
            )
            db_conn.commit()

def get_friend_requests(db_path, email):
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            cursor = db_conn.cursor()
            cursor.execute(
                '''SELECT fr.inviter, fr.time, u.username, u.avatar 
                   FROM FriendRequest fr 
                   JOIN UserTable u ON fr.inviter = u.email 
                   WHERE fr.invitee=? AND fr.status='pending' 
                   ORDER BY fr.time DESC''', 
                (email,)
            )
            return [{
                "inviter": row[0], 
                "time": row[1],
                "inviter_name": row[2],
                "inviter_avatar": row[3] if row[3] else ""
            } for row in cursor.fetchall()]

def add_friend(db_path, user1, user2):
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            current_time = time.time()
            # 先发送好友请求
            db_conn.execute(
                "INSERT OR REPLACE INTO FriendRequest (inviter, invitee, time) VALUES (?, ?, ?)", 
                (user1, user2, current_time)
            )
            db_conn.commit()

def are_friends(db_path, user1, user2):
    """检查两个用户是否已经是好友"""
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            cursor = db_conn.cursor()
            cursor.execute("SELECT 1 FROM FriendTable WHERE user1=? AND user2=?", (user1, user2))
            return cursor.fetchone() is not None

def get_friend_list(db_path, email):
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            cursor = db_conn.cursor()
            cursor.execute(
                '''SELECT u.email, u.username, u.avatar, u.status 
                   FROM FriendTable ft 
                   JOIN UserTable u ON ft.user2 = u.email 
                   WHERE ft.user1=?''', 
                (email,)
            )
            return [{
                "email": row[0], 
                "name": row[1], 
                "avatar": row[2] if row[2] else "",
                "status": row[3] if row[3] else "offline"
            } for row in cursor.fetchall()]

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

def accept_friend(db_path, inviter, invitee):
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            current_time = time.time()
            # 删除好友请求
            db_conn.execute("DELETE FROM FriendRequest WHERE inviter=? AND invitee=?", (inviter, invitee))
            # 添加双向好友关系
            db_conn.execute("INSERT INTO FriendTable (user1, user2, created_at) VALUES (?, ?, ?)", (inviter, invitee, current_time))
            db_conn.execute("INSERT INTO FriendTable (user1, user2, created_at) VALUES (?, ?, ?)", (invitee, inviter, current_time))
            db_conn.commit()

def reject_friend(db_path, inviter, invitee):
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            db_conn.execute("UPDATE FriendRequest SET status='rejected' WHERE inviter=? AND invitee=?", (inviter, invitee))
            db_conn.commit()

def get_mutual_friends(db_path, user1, user2):
    """获取两个用户的共同好友"""
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            cursor = db_conn.cursor()
            cursor.execute(
                '''SELECT u.email, u.username, u.avatar 
                   FROM UserTable u
                   WHERE u.email IN (
                       SELECT ft1.user2 FROM FriendTable ft1 WHERE ft1.user1 = ?
                   ) AND u.email IN (
                       SELECT ft2.user2 FROM FriendTable ft2 WHERE ft2.user1 = ?
                   )''',
                (user1, user2)
            )
            return [{
                "email": row[0],
                "name": row[1],
                "avatar": row[2] if row[2] else ""
            } for row in cursor.fetchall()]

# ================= 聊天消息相关 =================

def save_message(db_path, sender, receiver, content, timestamp, msg_type="text"):
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            cursor = db_conn.cursor()
            cursor.execute(
                "INSERT INTO MessageTable (sender, receiver, content, timestamp, type) VALUES (?, ?, ?, ?, ?)",
                (sender, receiver, content, timestamp, msg_type)
            )
            db_conn.commit()
            return cursor.lastrowid

def get_messages(db_path, user1, user2, limit=100):
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            cursor = db_conn.cursor()
            cursor.execute(
                '''SELECT id, sender, receiver, content, timestamp, type, is_read FROM MessageTable
                   WHERE (sender=? AND receiver=?) OR (sender=? AND receiver=?)
                   ORDER BY timestamp DESC LIMIT ?''',
                (user1, user2, user2, user1, limit)
            )
            messages = cursor.fetchall()[::-1]  # 正序返回
            return [{
                "id": msg[0],
                "sender": msg[1],
                "receiver": msg[2],
                "content": msg[3],
                "timestamp": msg[4],
                "type": msg[5],
                "is_read": bool(msg[6])
            } for msg in messages]

def mark_messages_read(db_path, user, sender):
    """标记特定发送者的消息为已读"""
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            db_conn.execute(
                "UPDATE MessageTable SET is_read=1 WHERE receiver=? AND sender=?",
                (user, sender)
            )
            db_conn.commit()

def get_unread_message_count(db_path, user):
    """获取未读消息数量"""
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            cursor = db_conn.cursor()
            cursor.execute(
                "SELECT COUNT(*) FROM MessageTable WHERE receiver=? AND is_read=0",
                (user,)
            )
            row = cursor.fetchone()
            return row[0] if row else 0

def delete_message(db_path, message_id, user):
    """删除消息（只有发送者可以删除）"""
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            db_conn.execute(
                "DELETE FROM MessageTable WHERE id=? AND sender=?",
                (message_id, user)
            )
            db_conn.commit()

def get_recent_conversations(db_path, user_email, limit=20):
    """获取最近的聊天对话列表"""
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            cursor = db_conn.cursor()
            cursor.execute(
                '''SELECT DISTINCT
                       CASE WHEN sender = ? THEN receiver ELSE sender END as contact_email,
                       MAX(timestamp) as last_message_time,
                       (SELECT content FROM MessageTable m2 
                        WHERE ((m2.sender = ? AND m2.receiver = contact_email) OR 
                               (m2.sender = contact_email AND m2.receiver = ?))
                        ORDER BY timestamp DESC LIMIT 1) as last_message,
                       (SELECT COUNT(*) FROM MessageTable m3 
                        WHERE m3.sender = contact_email AND m3.receiver = ? AND m3.is_read = 0) as unread_count
                   FROM MessageTable 
                   WHERE sender = ? OR receiver = ?
                   GROUP BY contact_email
                   ORDER BY last_message_time DESC
                   LIMIT ?''',
                (user_email, user_email, user_email, user_email, user_email, user_email, limit)
            )
            
            conversations = []
            for row in cursor.fetchall():
                contact_email = row[0]
                # 获取联系人信息
                contact_info = find_user(db_path, contact_email)
                conversations.append({
                    "contact_email": contact_email,
                    "contact_name": contact_info["name"] if contact_info else "未知用户",
                    "contact_avatar": contact_info["avatar"] if contact_info else "",
                    "last_message_time": row[1],
                    "last_message": row[2],
                    "unread_count": row[3],
                    "is_online": contact_info["status"] == "online" if contact_info else False
                })
            return conversations

# ================= 视频会话相关 =================

def create_video_session(db_path, session_id, caller, callee):
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            db_conn.execute(
                "INSERT INTO VideoSession (session_id, caller, callee, status, created_at) VALUES (?, ?, ?, ?, ?)",
                (session_id, caller, callee, "pending", time.time())
            )
            db_conn.commit()

def update_video_session_status(db_path, session_id, status):
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            current_time = time.time()
            cursor = db_conn.cursor()
            
            if status == "accepted":
                db_conn.execute(
                    "UPDATE VideoSession SET status=?, start_time=? WHERE session_id=?",
                    (status, current_time, session_id)
                )
            elif status == "ended":
                # 计算通话时长
                cursor.execute("SELECT start_time FROM VideoSession WHERE session_id=?", (session_id,))
                row = cursor.fetchone()
                start_time = row[0] if row and row[0] else current_time
                duration = int(current_time - start_time) if start_time else 0
                
                db_conn.execute(
                    "UPDATE VideoSession SET status=?, end_time=?, duration=? WHERE session_id=?",
                    (status, current_time, duration, session_id)
                )
            elif status == "rejected":
                # 添加拒绝时间记录
                db_conn.execute(
                    "UPDATE VideoSession SET status=?, end_time=? WHERE session_id=?",
                    (status, current_time, session_id)
                )
            else:
                db_conn.execute(
                    "UPDATE VideoSession SET status=? WHERE session_id=?",
                    (status, session_id)
                )
            db_conn.commit()
            
            # 返回更新后的会话信息
            return get_video_session(db_path, session_id)

def get_video_session(db_path, session_id):
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            cursor = db_conn.cursor()
            cursor.execute(
                "SELECT session_id, caller, callee, status, start_time, end_time, duration, created_at FROM VideoSession WHERE session_id=?",
                (session_id,)
            )
            row = cursor.fetchone()
            if row:
                return {
                    "session_id": row[0],
                    "caller": row[1],
                    "callee": row[2],
                    "status": row[3],
                    "start_time": row[4],
                    "end_time": row[5],
                    "duration": row[6],
                    "created_at": row[7]
                }
            return None

def get_video_call_history(db_path, user, limit=50):
    """获取用户的视频通话历史"""
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            cursor = db_conn.cursor()
            cursor.execute(
                '''SELECT vs.session_id, vs.caller, vs.callee, vs.status, vs.start_time, vs.end_time, vs.duration, vs.created_at,
                          u1.username as caller_name, u2.username as callee_name
                   FROM VideoSession vs
                   LEFT JOIN UserTable u1 ON vs.caller = u1.email
                   LEFT JOIN UserTable u2 ON vs.callee = u2.email
                   WHERE vs.caller=? OR vs.callee=?
                   ORDER BY vs.created_at DESC LIMIT ?''',
                (user, user, limit)
            )
            return [{
                "session_id": row[0],
                "caller": row[1],
                "callee": row[2],
                "status": row[3],
                "start_time": row[4],
                "end_time": row[5],
                "duration": row[6],
                "created_at": row[7],
                "caller_name": row[8],
                "callee_name": row[9],
                "is_outgoing": row[1] == user
            } for row in cursor.fetchall()]

def get_active_video_calls(db_path, user):
    """获取用户的活跃通话（pending 或 accepted 状态）"""
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            cursor = db_conn.cursor()
            cursor.execute(
                '''SELECT vs.session_id, vs.caller, vs.callee, vs.status, vs.created_at,
                          u1.username as caller_name, u2.username as callee_name
                   FROM VideoSession vs
                   LEFT JOIN UserTable u1 ON vs.caller = u1.email
                   LEFT JOIN UserTable u2 ON vs.callee = u2.email
                   WHERE (vs.caller=? OR vs.callee=?) AND vs.status IN ('pending', 'accepted')
                   ORDER BY vs.created_at DESC''',
                (user, user)
            )
            return [{
                "session_id": row[0],
                "caller": row[1],
                "callee": row[2],
                "status": row[3],
                "created_at": row[4],
                "caller_name": row[5],
                "callee_name": row[6],
                "is_outgoing": row[1] == user
            } for row in cursor.fetchall()]

def check_video_session_exists(db_path, session_id):
    """检查视频会话是否存在"""
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            cursor = db_conn.cursor()
            cursor.execute("SELECT 1 FROM VideoSession WHERE session_id=?", (session_id,))
            return cursor.fetchone() is not None

def get_call_statistics(db_path, user_email, days=30):
    """获取通话统计信息"""
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            cursor = db_conn.cursor()
            since_time = time.time() - (days * 24 * 60 * 60)
            
            # 总通话次数
            cursor.execute(
                "SELECT COUNT(*) FROM VideoSession WHERE (caller=? OR callee=?) AND status='ended' AND created_at > ?",
                (user_email, user_email, since_time)
            )
            total_calls = cursor.fetchone()[0]
            
            # 总通话时长
            cursor.execute(
                "SELECT SUM(duration) FROM VideoSession WHERE (caller=? OR callee=?) AND status='ended' AND created_at > ?",
                (user_email, user_email, since_time)
            )
            total_duration = cursor.fetchone()[0] or 0
            
            # 发起的通话
            cursor.execute(
                "SELECT COUNT(*) FROM VideoSession WHERE caller=? AND status='ended' AND created_at > ?",
                (user_email, since_time)
            )
            outgoing_calls = cursor.fetchone()[0]
            
            # 接听的通话
            cursor.execute(
                "SELECT COUNT(*) FROM VideoSession WHERE callee=? AND status='ended' AND created_at > ?",
                (user_email, since_time)
            )
            incoming_calls = cursor.fetchone()[0]
            
            return {
                "total_calls": total_calls,
                "total_duration": total_duration,
                "outgoing_calls": outgoing_calls,
                "incoming_calls": incoming_calls,
                "average_duration": total_duration // total_calls if total_calls > 0 else 0,
                "period_days": days
            }

def cleanup_old_sessions(db_path, days=7):
    """清理旧的视频会话记录"""
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            cutoff_time = time.time() - (days * 24 * 60 * 60)
            cursor = db_conn.cursor()
            
            # 删除超过指定天数的已结束会话
            cursor.execute(
                "DELETE FROM VideoSession WHERE status IN ('ended', 'rejected', 'canceled') AND created_at < ?",
                (cutoff_time,)
            )
            
            deleted_count = cursor.rowcount
            db_conn.commit()
            return deleted_count

# ================= 通话质量反馈 =================

def save_call_quality_feedback(db_path, session_id, user_email, rating, feedback=""):
    """保存通话质量反馈"""
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            cursor = db_conn.cursor()
            cursor.execute(
                "INSERT INTO CallQualityFeedback (session_id, user_email, rating, feedback, created_at) VALUES (?, ?, ?, ?, ?)",
                (session_id, user_email, rating, feedback, time.time())
            )
            db_conn.commit()
            return cursor.lastrowid

def get_call_quality_feedback(db_path, session_id):
    """获取通话质量反馈"""
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            cursor = db_conn.cursor()
            cursor.execute(
                '''SELECT cqf.id, cqf.user_email, cqf.rating, cqf.feedback, cqf.created_at, u.username
                   FROM CallQualityFeedback cqf
                   LEFT JOIN UserTable u ON cqf.user_email = u.email
                   WHERE cqf.session_id = ?
                   ORDER BY cqf.created_at DESC''',
                (session_id,)
            )
            return [{
                "id": row[0],
                "user_email": row[1],
                "user_name": row[5] or "未知用户",
                "rating": row[2],
                "feedback": row[3],
                "created_at": row[4]
            } for row in cursor.fetchall()]

# ================= 通知相关 =================

def save_notification(db_path, user_email, content, notification_type="info", title="", timestamp=None):
    """保存通知"""
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            cursor = db_conn.cursor()
            cursor.execute(
                "INSERT INTO NotificationTable (user_email, title, content, type, created_at) VALUES (?, ?, ?, ?, ?)",
                (user_email, title, content, notification_type, timestamp or time.time())
            )
            db_conn.commit()
            return cursor.lastrowid

def get_notifications(db_path, user_email, limit=50, offset=0):
    """获取用户通知"""
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            cursor = db_conn.cursor()
            cursor.execute(
                '''SELECT id, title, content, type, is_read, created_at 
                   FROM NotificationTable 
                   WHERE user_email=? 
                   ORDER BY created_at DESC 
                   LIMIT ? OFFSET ?''',
                (user_email, limit, offset)
            )
            return [{
                "id": row[0],
                "title": row[1],
                "content": row[2],
                "type": row[3],
                "is_read": bool(row[4]),
                "timestamp": row[5]
            } for row in cursor.fetchall()]

def mark_notification_read(db_path, user_email, notification_id):
    """标记通知为已读"""
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            db_conn.execute(
                "UPDATE NotificationTable SET is_read=1 WHERE id=? AND user_email=?",
                (notification_id, user_email)
            )
            db_conn.commit()

def mark_all_notifications_read(db_path, user_email):
    """标记所有通知为已读"""
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            db_conn.execute(
                "UPDATE NotificationTable SET is_read=1 WHERE user_email=?",
                (user_email,)
            )
            db_conn.commit()

def get_unread_notification_count(db_path, user_email):
    """获取未读通知数量"""
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            cursor = db_conn.cursor()
            cursor.execute(
                "SELECT COUNT(*) FROM NotificationTable WHERE user_email=? AND is_read=0",
                (user_email,)
            )
            row = cursor.fetchone()
            return row[0] if row else 0

def delete_notification(db_path, user_email, notification_id):
    """删除通知"""
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            db_conn.execute(
                "DELETE FROM NotificationTable WHERE id=? AND user_email=?",
                (notification_id, user_email)
            )
            db_conn.commit()

def update_notification_settings(db_path, user_email, enable):
    """更新通知设置"""
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            db_conn.execute(
                "INSERT OR REPLACE INTO UserSettings (user_email, notification_enabled) VALUES (?, ?)",
                (user_email, enable)
            )
            db_conn.commit()

def get_notification_settings(db_path, user_email):
    """获取通知设置"""
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            cursor = db_conn.cursor()
            cursor.execute(
                "SELECT notification_enabled, sound_enabled FROM UserSettings WHERE user_email=?",
                (user_email,)
            )
            row = cursor.fetchone()
            if row:
                return {
                    "notification_enabled": bool(row[0]),
                    "sound_enabled": bool(row[1])
                }
            else:
                # 返回默认设置
                return {
                    "notification_enabled": True,
                    "sound_enabled": True
                }

# ================= 系统维护功能 =================

def get_database_stats(db_path):
    """获取数据库统计信息"""
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            cursor = db_conn.cursor()
            
            stats = {}
            
            # 用户统计
            cursor.execute("SELECT COUNT(*) FROM UserTable")
            stats['total_users'] = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM UserTable WHERE status='online'")
            stats['online_users'] = cursor.fetchone()[0]
            
            # 消息统计
            cursor.execute("SELECT COUNT(*) FROM MessageTable")
            stats['total_messages'] = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM MessageTable WHERE is_read=0")
            stats['unread_messages'] = cursor.fetchone()[0]
            
            # 通话统计
            cursor.execute("SELECT COUNT(*) FROM VideoSession")
            stats['total_calls'] = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM VideoSession WHERE status='ended'")
            stats['completed_calls'] = cursor.fetchone()[0]
            
            # 好友统计
            cursor.execute("SELECT COUNT(*) FROM FriendTable")
            stats['total_friendships'] = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM FriendRequest WHERE status='pending'")
            stats['pending_requests'] = cursor.fetchone()[0]
            
            return stats

def cleanup_database(db_path, days=30):
    """数据库清理维护"""
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            cutoff_time = time.time() - (days * 24 * 60 * 60)
            
            # 清理旧的已读通知
            db_conn.execute(
                "DELETE FROM NotificationTable WHERE is_read=1 AND created_at < ?",
                (cutoff_time,)
            )
            
            # 清理拒绝的好友请求
            db_conn.execute(
                "DELETE FROM FriendRequest WHERE status='rejected' AND time < ?",
                (cutoff_time,)
            )
            
            # 清理旧的通话质量反馈
            db_conn.execute(
                "DELETE FROM CallQualityFeedback WHERE created_at < ?",
                (cutoff_time,)
            )
            
            db_conn.commit()
            
            # 执行 VACUUM 优化数据库
            db_conn.execute("VACUUM")

def optimize_database(db_path):
    """优化数据库性能"""
    with db_lock:
        with sqlite3.connect(db_path) as db_conn:
            # 创建索引优化查询性能
            indexes = [
                "CREATE INDEX IF NOT EXISTS idx_message_sender_receiver ON MessageTable(sender, receiver)",
                "CREATE INDEX IF NOT EXISTS idx_message_timestamp ON MessageTable(timestamp)",
                "CREATE INDEX IF NOT EXISTS idx_video_session_caller ON VideoSession(caller)",
                "CREATE INDEX IF NOT EXISTS idx_video_session_callee ON VideoSession(callee)",
                "CREATE INDEX IF NOT EXISTS idx_video_session_status ON VideoSession(status)",
                "CREATE INDEX IF NOT EXISTS idx_friend_table_user1 ON FriendTable(user1)",
                "CREATE INDEX IF NOT EXISTS idx_notification_user ON NotificationTable(user_email, is_read)",
            ]
            
            for index_sql in indexes:
                try:
                    db_conn.execute(index_sql)
                except sqlite3.Error as e:
                    print(f"创建索引失败: {e}")
            
            db_conn.commit()
