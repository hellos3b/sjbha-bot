const approveList = new Map()

const tagPending = `<span class="tag is-light">Pending</span>`
const tagApproving = `<span class="tag is-link">Add to Approved</span>`

document.querySelectorAll('.pending').forEach( el => {
  const id = el.getAttribute("data-id")
  const name = el.getAttribute("data-name")

  const badge = el.querySelector('.badge')

  badge.innerHTML = tagPending

  el.onclick = () => {
    if (!approveList.has(id)) {
      el.classList.add("is-active")
      approveList.set(id, name)
      badge.innerHTML = tagApproving
    } else {
      el.classList.remove("is-active")
      approveList.delete(id)
      badge.innerHTML = tagPending
    }
    console.log("Click pending!", id)
  }
})

const save = document.getElementById("update")

save.onclick = () => {
  if (approveList.size === 0) {
    alert(`You haven't marked anyone as approve.\n\nFirst select the users you would like to approve, and then hit save`)
    return;
  }

  const ids = Array.from(approveList.keys())
  const names = Array.from(approveList.values())

  const confirm = window.confirm(`Approve these users to your meetup?\n\n${names.join(', ')}`)
  if (confirm) {
    console.log("SUBMIT", ids)
  }
}