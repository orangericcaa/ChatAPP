#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
独立的验证码邮件发送脚本
供Node.js后端调用
"""

import sys
import json
import smtplib
import random
from email.mime.text import MIMEText
from email.header import Header

def send_verification_email(email: str, vericode: str) -> bool:
    """发送验证码邮件"""
    
    mail_html = f"""<p class=MsoNormal style='layout-grid-mode:char'><span style='font-size:14.0pt;
font-family:宋体;mso-ascii-font-family:"Times New Roman";mso-hansi-font-family:
"Times New Roman"'>您的验证码为：</span><span lang=EN-US style='font-size:14.0pt;
font-family:"Times New Roman",serif;mso-fareast-font-family:宋体;mso-bidi-theme-font:
minor-bidi'><o:p></o:p></span></p>
<p class=MsoNormal align=center style='margin-top:7.8pt;margin-right:0cm;
margin-bottom:7.8pt;margin-left:0cm;mso-para-margin-top:.5gd;mso-para-margin-right:
0cm;mso-para-margin-bottom:.5gd;mso-para-margin-left:0cm;text-align:center;
layout-grid-mode:char'><b><span lang=EN-US style='font-size:22.0pt;font-family:
"Times New Roman",serif;mso-fareast-font-family:宋体;mso-bidi-font-family:Arial;
letter-spacing:3.0pt'>{vericode}<o:p></o:p></span></b></p>
<p class=MsoNormal style='layout-grid-mode:char'><span style='font-size:14.0pt;
font-family:宋体;mso-ascii-font-family:"Times New Roman";mso-hansi-font-family:
"Times New Roman"'>此验证码包含数字与大写英文字母，输入时请注意字母大小写是否正确。验证码</span><span lang=EN-US
style='font-size:14.0pt;font-family:"Times New Roman",serif;mso-fareast-font-family:
宋体;mso-bidi-theme-font:minor-bidi'>10</span><span style='font-size:14.0pt;
font-family:宋体;mso-ascii-font-family:"Times New Roman";mso-hansi-font-family:
"Times New Roman"'>分钟内有效。</span><span lang=EN-US style='font-size:14.0pt;
font-family:"Times New Roman",serif;mso-fareast-font-family:宋体;mso-bidi-theme-font:
minor-bidi'><o:p></o:p></span></p>"""
    
    message = MIMEText(mail_html, 'html', 'utf-8')
    message['From'] = 'Server <202695135@qq.com>'
    message['To'] = f'<{email}>'
    message['Subject'] = Header("验证码", 'utf-8')
    
    try:
        server = smtplib.SMTP_SSL('smtp.qq.com')
        server.login('202695135@qq.com', 'apfimosnwxpfbidg')
        server.sendmail('202695135@qq.com', [email], message.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"邮件发送失败: {e}", file=sys.stderr)
        return False

def main():
    """主函数，从命令行参数读取邮箱和验证码"""
    if len(sys.argv) != 3:
        print(json.dumps({"success": False, "error": "参数错误"}))
        sys.exit(1)
    
    email = sys.argv[1]
    vericode = sys.argv[2]
    
    # 验证邮箱格式
    import re
    email_regex = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    if not re.match(email_regex, email):
        print(json.dumps({"success": False, "error": "邮箱格式不正确"}))
        sys.exit(1)
    
    # 发送邮件
    success = send_verification_email(email, vericode)
    
    if success:
        print(json.dumps({"success": True, "message": "验证码邮件发送成功"}))
    else:
        print(json.dumps({"success": False, "error": "邮件发送失败"}))

if __name__ == "__main__":
    main()
