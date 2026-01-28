const { sequelize, DataTypes } = require('../authen/config/m3db')

const Customer = sequelize.define(
  'OCUSMA',
  {
    customerNo: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      field: 'OKCUNO'
    },
    customerStatus: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      field: 'OKSTAT'
    },
    customerChannel: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'OKCUCL'
    },
    customerName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'OKCUNM'
    },
    coNo: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      field: 'OKCONO'
    },
    addressID: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'OKADID'
    },
    customerAddress1: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'OKCUA1'
    },
    customerAddress2: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'OKCUA2'
    },
    customerAddress3: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'OKCUA3'
    },
    customerAddress4: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'OKCUA4'
    },
    customerPoscode: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'OKPONO'
    },
    customerPhone: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'OKPHNO'
    },
    creditTerm: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'OKTEPY'
    },
    customerCoType: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'OKORTP'
    },
    warehouse: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'OKWHLO'
    },
    saleZone: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'OKSDST'
    },
    saleTeam: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'OKCFC8'
    },
    OKCFC1: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'OKCFC1'
    },
    OKCFC3: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'OKCFC3'
    },
    OKCFC6: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'OKCFC6'
    },
    salePayer: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'OKPYNO'
    },
    creditLimit: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'OKCRL2'
    },
    taxno: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'OKVRNO'
    },
    saleCode: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'OKSMCD'
    },
    OKRESP: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'OKRESP'
    },
    OKUSR1: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'OKUSR1'
    },
    OKUSR2: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'OKUSR2'
    },
    OKUSR3: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'OKUSR3'
    },
    OKDTE1: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'OKDTE1'
    },
    OKDTE2: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'OKDTE2'
    },
    OKDTE3: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'OKDTE3'
    },
    OKRGDT: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'OKRGDT'
    },
    OKRGTM: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'OKRGTM'
    },
    OKLMDT: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'OKLMDT'
    },
    OKCHID: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'OKCHID'
    },
    OKLMTS: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'OKLMTS'
    },
    OKALCU: {
      type: DataTypes.INTEGER,

      field: 'OKALCU'
    },
    OKCSCD: {
      type: DataTypes.INTEGER,

      field: 'OKCSCD'
    },
    OKECAR: {
      type: DataTypes.INTEGER,

      field: 'OKECAR'
    },
    OKFACI: {
      type: DataTypes.INTEGER,

      field: 'OKFACI'
    },
    OKINRC: {
      type: DataTypes.INTEGER,

      field: 'OKINRC'
    },
    OKCUCD: {
      type: DataTypes.INTEGER,

      field: 'OKCUCD'
    },
    OKPYCD: {
      type: DataTypes.INTEGER,

      field: 'OKPYCD'
    },
    OKMODL: {
      type: DataTypes.INTEGER,

      field: 'OKMODL'
    },
    OKTEDL: {
      type: DataTypes.INTEGER,

      field: 'OKTEDL'
    },
    OKFRE1: {
      type: DataTypes.INTEGER,

      field: 'OKFRE1'
    },
    OKCFC4: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'OKCFC4'
    }
  },
  {
    freezeTableName: true,
    timestamps: false,
    createdAt: false,
    updatedAt: false,
    primaryKey: false
  }
)

const PromotionStore = sequelize.define(
  'OPROMC',
  {
    coNo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'FBCONO'
    },
    proId: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      field: 'FBPIDE'
    },
    FBCUNO: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      field: 'FBCUNO'
    },
    FBDIVI: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      field: 'FBDIVI'
    },
    FBCUTP: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      field: 'FBCUTP'
    },
    customerChannel: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      field: 'FBCUCL'
    },
    saleCode: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      field: 'FBSMCD'
    },
    orderType: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      field: 'FBORTP'
    },
    warehouse: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      field: 'FBWHLO'
    },
    zone: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      field: 'FBSDST'
    },
    FBCSCD: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      field: 'FBCSCD'
    },
    FBPYNO: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      field: 'FBPYNO'
    },
    posccode: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      field: 'FBPONO'
    },
    area: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      field: 'FBCFC1'
    },
    FBCFC3: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      field: 'FBCFC3'
    },
    FBCFC6: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      field: 'FBCFC6'
    },
    FBFVDT: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      field: 'FBFVDT'
    },
    FBLVDT: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      field: 'FBLVDT'
    },
    FBRGDT: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      field: 'FBRGDT'
    },
    FBRGTM: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      field: 'FBRGTM'
    },
    FBLMDT: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      field: 'FBLMDT'
    },
    FBCHNO: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      field: 'FBCHNO'
    },
    FBCHID: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      field: 'FBCHID'
    },
    FBPRI2: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      field: 'FBPRI2'
    },
    FBFRE1: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      field: 'FBFRE1'
    },
    FBECAR: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      field: 'FBECAR'
    }
  },
  {
    freezeTableName: true,
    timestamps: false,
    createdAt: false,
    updatedAt: false,
    primaryKey: false
  }
)

const ItemM3 = sequelize.define(
  'MITMAS',
  {
    MMCONO: {
      type: DataTypes.STRING,
      field: 'MMCONO'
    },
    MMSTAT: { type: DataTypes.STRING, field: 'MMSTAT' },
    MMITNO: { type: DataTypes.STRING, field: 'MMITNO' },
    MMFUDS: { type: DataTypes.STRING, field: 'MMFUDS' },
    MMITDS: { type: DataTypes.STRING, field: 'MMITDS' }
  },
  {
    tableName: 'MITMAS',
    schema: 'MVXJDTA', // ✅ ระบุ schema
    freezeTableName: true, // ✅ กันเติม s
    timestamps: false
  }
)

const OOHEAD = sequelize.define(
  'OOHEAD',
  {
    OAORNO: {
      type: DataTypes.STRING,
      field: 'OAORNO'
    }
  },
  {
    OACUOR: {
      type: DataTypes.STRING,
      field: 'OACUOR'
    }
  },
  {
    OAORTP: {
      type: DataTypes.STRING,
      field: 'OAORTP'
    }
  },
  {
    tableName: 'OOHEAD',
    schema: 'MVXJDTA', // ✅ ระบุ schema
    freezeTableName: true, // ✅ กันเติม s
    timestamps: false
  }
)

module.exports = {
  Customer,
  PromotionStore,
  ItemM3,
  OOHEAD
}
