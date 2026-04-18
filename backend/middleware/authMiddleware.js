const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const supabase = req.app.get('supabase');
      const { data: user, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', decoded.id)
        .single();

      if (!user || error) {
        return res.status(401).json({ message: 'No autorizado, usuario no encontrado' });
      }

      // Mapeo para mantener compatibilidad con el código existente
      req.user = { 
        ...user, 
        _id: user.id, 
        isAdmin: user.is_admin 
      };

      next();
    } catch (error) {
      res.status(401).json({ message: 'No autorizado, token fallido' });
    }
  } else {
    res.status(401).json({ message: 'No autorizado, no hay token' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401).json({ message: 'No autorizado como administrador' });
  }
};

module.exports = { protect, admin };