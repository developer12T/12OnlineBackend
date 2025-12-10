exports.getCustomer = async (req, res) => {
  try {
    res.status(200).json({
      status: 200,
      message: 'Successful!',
      data: 'TEST Success'
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ status: '500', message: error.message })
  }
}