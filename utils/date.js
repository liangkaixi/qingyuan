/**
 * 格式化时间为 HH:mm 格式
 * @param {string|number|Date} time 时间戳或日期对象
 * @returns {string} 格式化后的时间字符串
 */
export const formatTime = (time) => {
	const date = new Date(time)
	const hours = date.getHours().toString().padStart(2, '0')
	const minutes = date.getMinutes().toString().padStart(2, '0')
	return `${hours}:${minutes}`
}

/**
 * 格式化日期为 YYYY-MM-DD 格式
 * @param {string|number|Date} date 时间戳或日期对象
 * @returns {string} 格式化后的日期字符串
 */
export const formatDate = (date) => {
	const d = new Date(date)
	const year = d.getFullYear()
	const month = (d.getMonth() + 1).toString().padStart(2, '0')
	const day = d.getDate().toString().padStart(2, '0')
	return `${year}-${month}-${day}`
}

/**
 * 格式化日期时间为 YYYY-MM-DD HH:mm 格式
 * @param {string|number|Date} datetime 时间戳或日期对象
 * @returns {string} 格式化后的日期时间字符串
 */
export const formatDateTime = (datetime) => {
	return `${formatDate(datetime)} ${formatTime(datetime)}`
}

/**
 * 获取相对时间描述
 * @param {string|number|Date} time 时间戳或日期对象
 * @returns {string} 相对时间描述
 */
export const getRelativeTime = (time) => {
	const now = new Date()
	const date = new Date(time)
	const diff = now - date
	
	const minute = 60 * 1000
	const hour = 60 * minute
	const day = 24 * hour
	
	if (diff < minute) {
		return '刚刚'
	} else if (diff < hour) {
		return `${Math.floor(diff / minute)}分钟前`
	} else if (diff < day) {
		return `${Math.floor(diff / hour)}小时前`
	} else if (diff < 7 * day) {
		return `${Math.floor(diff / day)}天前`
	} else {
		return formatDate(date)
	}
}

/**
 * 获取星期几
 * @param {string|number|Date} date 时间戳或日期对象
 * @returns {string} 星期几
 */
export const getWeekDay = (date) => {
	const d = new Date(date)
	const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
	return weekDays[d.getDay()]
}

/**
 * 判断两个日期是否是同一天
 * @param {string|number|Date} date1 第一个日期
 * @param {string|number|Date} date2 第二个日期
 * @returns {boolean} 是否是同一天
 */
export const isSameDay = (date1, date2) => {
	const d1 = new Date(date1)
	const d2 = new Date(date2)
	return d1.getFullYear() === d2.getFullYear() &&
		d1.getMonth() === d2.getMonth() &&
		d1.getDate() === d2.getDate()
} 
 