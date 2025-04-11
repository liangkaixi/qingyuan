import { ref } from 'vue'

export function useAuth() {
  const isAuthenticated = ref(false)
  const userInfo = ref(null)
  
  // 检查登录状态
  const checkAuth = () => {
    const token = uni.getStorageSync('uni_id_token')
    const userInfoStr = uni.getStorageSync('uni-id-pages-user-info')
    
    isAuthenticated.value = !!token
    if (userInfoStr) {
      try {
        userInfo.value = JSON.parse(userInfoStr)
      } catch (e) {
        console.error('解析用户信息失败', e)
      }
    }
    
    return isAuthenticated.value
  }
  
  // 获取用户信息
  const getUserInfo = () => {
    return userInfo.value
  }
  
  // 更新用户信息
  const updateUserInfo = (info) => {
    userInfo.value = info
    uni.setStorageSync('uni-id-pages-user-info', JSON.stringify(info))
  }
  
  // 清除用户信息
  const clearUserInfo = () => {
    userInfo.value = null
    uni.removeStorageSync('uni-id-pages-user-info')
    uni.removeStorageSync('uni_id_token')
    isAuthenticated.value = false
  }
  
  return {
    isAuthenticated,
    userInfo,
    checkAuth,
    getUserInfo,
    updateUserInfo,
    clearUserInfo
  }
} 