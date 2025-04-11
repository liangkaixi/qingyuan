/**
 * 请求拦截器
 */

// 请求配置
const config = {
  baseURL: '', // 基础URL
  timeout: 60000, // 超时时间
  header: {
    'content-type': 'application/json'
  }
}

// 请求拦截器
const requestInterceptor = (options) => {
  // 获取token
  const token = uni.getStorageSync('uni_id_token')
  if (token) {
    options.header = {
      ...options.header,
      'uni-id-token': token
    }
  }
  return options
}

// 响应拦截器
const responseInterceptor = (response) => {
  const { statusCode, data } = response
  
  // 请求成功
  if (statusCode >= 200 && statusCode < 300) {
    return data
  }
  
  // 处理错误
  if (statusCode === 401) {
    // token过期，跳转到登录页
    uni.navigateTo({
      url: '/uni_modules/uni-id-pages/pages/login/login-withoutpwd'
    })
    return Promise.reject(new Error('未登录或登录已过期'))
  }
  
  return Promise.reject(new Error(data.message || '请求失败'))
}

// 创建请求方法
const request = (options) => {
  // 合并配置
  options = {
    ...config,
    ...options,
    url: config.baseURL + options.url
  }
  
  // 请求拦截
  options = requestInterceptor(options)
  
  // 发起请求
  return new Promise((resolve, reject) => {
    uni.request({
      ...options,
      success: (res) => {
        resolve(responseInterceptor(res))
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '网络请求失败'))
      }
    })
  })
}

// 封装常用请求方法
export const http = {
  get(url, data = {}, options = {}) {
    return request({
      url,
      data,
      method: 'GET',
      ...options
    })
  },
  
  post(url, data = {}, options = {}) {
    return request({
      url,
      data,
      method: 'POST',
      ...options
    })
  },
  
  put(url, data = {}, options = {}) {
    return request({
      url,
      data,
      method: 'PUT',
      ...options
    })
  },
  
  delete(url, data = {}, options = {}) {
    return request({
      url,
      data,
      method: 'DELETE',
      ...options
    })
  }
}

export default http 