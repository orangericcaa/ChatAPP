#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试邮件发送功能的脚本
"""

import sys
import subprocess
import json

def test_email_sending():
    """测试邮件发送功能"""
    print("🧪 测试邮件发送功能...")
    
    # 使用测试邮箱
    test_email = input("请输入测试邮箱地址: ").strip()
    if not test_email:
        print("❌ 邮箱地址不能为空")
        return False
    
    # 生成测试验证码
    test_code = "TEST123"
    
    print(f"📧 正在向 {test_email} 发送测试验证码: {test_code}")
    
    try:
        # 调用邮件发送脚本
        result = subprocess.run([
            sys.executable, 'send_email.py', test_email, test_code
        ], capture_output=True, text=True, timeout=30)
        
        print(f"🔄 进程退出码: {result.returncode}")
        print(f"📝 标准输出: {result.stdout}")
        if result.stderr:
            print(f"⚠️  错误输出: {result.stderr}")
        
        if result.returncode == 0:
            try:
                response = json.loads(result.stdout.strip())
                if response.get('success'):
                    print("✅ 邮件发送成功！")
                    print(f"📬 请检查 {test_email} 的收件箱（包括垃圾邮件文件夹）")
                    return True
                else:
                    print(f"❌ 邮件发送失败: {response.get('error', '未知错误')}")
                    return False
            except json.JSONDecodeError as e:
                print(f"❌ 解析输出JSON失败: {e}")
                return False
        else:
            print(f"❌ 脚本执行失败，退出码: {result.returncode}")
            return False
            
    except subprocess.TimeoutExpired:
        print("❌ 邮件发送超时（30秒）")
        return False
    except FileNotFoundError:
        print("❌ 找不到Python解释器或send_email.py文件")
        return False
    except Exception as e:
        print(f"❌ 执行过程中发生异常: {e}")
        return False

def check_dependencies():
    """检查依赖"""
    print("🔍 检查依赖...")
    
    try:
        import smtplib
        print("✅ smtplib 模块可用")
    except ImportError:
        print("❌ smtplib 模块不可用")
        return False
    
    try:
        from email.mime.text import MIMEText
        from email.header import Header
        print("✅ email 模块可用")
    except ImportError:
        print("❌ email 模块不可用")
        return False
    
    return True

def main():
    print("=" * 50)
    print("📧 ChatAPP 邮件发送功能测试工具")
    print("=" * 50)
    
    # 检查依赖
    if not check_dependencies():
        print("\n❌ 依赖检查失败，请确保Python环境正常")
        return
    
    print("\n" + "=" * 50)
    
    # 测试邮件发送
    success = test_email_sending()
    
    print("\n" + "=" * 50)
    if success:
        print("🎉 测试完成！邮件发送功能正常")
        print("\n💡 现在可以启动Node.js服务器测试完整流程:")
        print("   cd e:\\ChatAPP\\backend")
        print("   node server.js")
    else:
        print("❌ 测试失败！请检查配置和网络连接")
        print("\n🔧 常见问题排查:")
        print("   1. 检查网络连接")
        print("   2. 确认QQ邮箱SMTP设置正确")
        print("   3. 检查授权码是否有效")
        print("   4. 确认目标邮箱地址正确")

if __name__ == "__main__":
    main()
