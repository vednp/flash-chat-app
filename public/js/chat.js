const socket = io()

const form = document.getElementById('form')
const input = document.getElementById('input')
const button = document.getElementById('send-button')
const locationButton = document.getElementById('location-btn')
const messages = document.getElementById('messages')
const messageTemplate = document.getElementById('message-template').innerHTML
const locationTemplate = document.getElementById('location-template').innerHTML
const sidebarTemplate = document.getElementById('sidebar-template').innerHTML
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoscroll = () => {
    // New message element
    const $newMessage = messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = messages.offsetHeight

    // Height of messages container
    const containerHeight = messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        messages.scrollTop = messages.scrollHeight
    }
}

socket.on('message', (msg)=>{
    console.log(msg);
    const html = Mustache.render(messageTemplate,{
        username:msg.username,
        message: msg.text,
        createdAt: moment(msg.createdAt).format('h:mm a ')
    })
    messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('message-send', (msg)=>{
    console.log(msg);
    const html = Mustache.render(messageTemplate,{
        username:msg.username,
        message: msg.text,
        createdAt: moment(msg.createdAt).format('h:mm a ')
    })
    messages.insertAdjacentHTML('beforeend',html)
    autoscroll()

})

socket.on('roomData',({room, users})=>{
    const html = Mustache.render(sidebarTemplate,{
        room,
        users
    })
    document.getElementById('sidebar').innerHTML = html
})

socket.on('location-url', (url)=>{
    const html = Mustache.render(locationTemplate,{
        username: url.username,
        url: url.url,
        createdAt: moment(url.createdAt).format('h:mm a ')
    })
    messages.insertAdjacentHTML('beforeend',html)
    autoscroll()

})

form.addEventListener('submit', (e)=>{
    e.preventDefault()
    button.setAttribute('disabled', 'disabled')
    // const input = e.target.elements.input-message;
    socket.emit('sendMessage', input.value,(msg)=>{
        button.removeAttribute('disabled')
        console.log('message delivered',msg);
        input.value = '';
    })
})

locationButton.addEventListener('click', (e)=>{
    e.preventDefault()
    if(!navigator.geolocation){
        alert('Not Supported By Your Browser')
    }
    navigator.geolocation.getCurrentPosition((location)=>{
        const latitude = location.coords.latitude;
        const longitude = location.coords.longitude;
        locationButton.setAttribute('disabled', 'disabled')
        socket.emit('sendLocation', {"latitude": latitude,"longitude": longitude}, ()=>{
            console.log('Location Shared');
            locationButton.removeAttribute('disabled')
        })
    })
})

socket.emit('join', {username, room}, (error)=>{
    if(error){
        alert(error)
        location.href = '/'
    }
})