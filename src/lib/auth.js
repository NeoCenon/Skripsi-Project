export function canAccessPage(role, page) {
  const adminPages = ['/instock', '/order', '/product', '/supplier', '/addproduct','/addstock','/addorder','/addsupplier',
    '/editproduct','/editstock','/editorder','/editsupplier'
  ]
  const ownerPages = ['/', '/dashboard', ...adminPages, '/accountmanagement', '/addaccount', '/editaccount', '/historyopname',
    '/opname',
  ]

  if (role === 'owner') return ownerPages.includes(page)
  if (role === 'admin') return adminPages.includes(page)
  return false
}
