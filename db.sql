-- UserData table
CREATE TABLE UserData (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Uid VARCHAR(255) NOT NULL UNIQUE COMMENT 'UID',
    State INT DEFAULT 0 COMMENT '状态',
    AvatarUrl VARCHAR(255) COMMENT '头像',
    Name VARCHAR(255) COMMENT '用户名',
    Integral INT DEFAULT 0 COMMENT '积分',
    RegTime BIGINT(255) NOT NULL COMMENT '注册时间',
    SessionToken VARCHAR(255) COMMENT '唯一会话令牌'
);

-- Checkins table
CREATE TABLE Checkins (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    UserId VARCHAR(255),
    ImagePath VARCHAR(255),
    Status ENUM('pending', 'scanned', 'approved', 'rejected') DEFAULT 'pending',
    INDEX idx_age(UserId)
    FOREIGN KEY (UserId) REFERENCES UserData(Uid)
);

-- Items table
CREATE TABLE Items (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(255),
    Description TEXT,
    Price INT
);

-- Redemptions table
CREATE TABLE Redemptions (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    UserId VARCHAR(255),
    ItemId INT NOT NULL,
    FOREIGN KEY (UserId) REFERENCES UserData(Uid),
    FOREIGN KEY (ItemId) REFERENCES Items(ID)
);

CREATE TABLE CheckinsQt(
    ID INT AUTO_INCREMENT PRIMARY KEY,
   	UserId VARCHAR(255) COMMENT "用户id",
   	Integral INT(11) COMMENT "获得积分",
    RegTime DATETIME,
    FOREIGN KEY(UserId) REFERENCES UserData(Uid)
)
