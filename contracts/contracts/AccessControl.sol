// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "./interfaces/IAccess.sol";

contract AccessControl is IAccess {
     
     mapping(address => Role) public roles;
     mapping(address => bool) public isActive;


   constructor() {
        roles[msg.sender] = Role.Admin;
        isActive[msg.sender] = true;
        emit UserRegistered(msg.sender, Role.Admin);
    }

    // Modifier pour restreindre l'accès à un rôle spécifique
    modifier onlyRole(Role _role) {
        require(isActive[msg.sender], "Utilisateur inactif");
        require(roles[msg.sender] == _role, "Acces refuse pour ce role");
        _;
    }

    // Modifier pour Admin seulement
    modifier onlyAdmin() {
        require(isActive[msg.sender], "Utilisateur inactif");
        require(roles[msg.sender] == Role.Admin, "Acces admin requis");
        _;
    }

    function registerUser(address _user,Role _role) public onlyAdmin {

        require(_user != address(0),    "Adresse invalide");
        require(!isActive[_user],       "Utilisateur deja enregistre");

        roles[_user]=_role;
        isActive[_user]=true;
        emit UserRegistered(_user,_role);
    }
function changeUserRole(address _user, Role _newRole) public onlyAdmin {
    require(isActive[_user], "Utilisateur non enregistre");
    require(_user != msg.sender, "Impossible de modifier son propre role");
    Role oldRole = roles[_user];
    roles[_user] = _newRole;
    emit RoleChanged(_user, oldRole, _newRole);
}
function setUserActive(address _user, bool _active) public onlyAdmin {
     require(_user != msg.sender, "Impossible de se desactiver soi-meme");
    isActive[_user] = _active;
    emit UserStatusChanged(_user, _active);
}
    
    function checkRole(address _user) public view returns(Role) {
    return roles[_user];
}

function isPatient(address u) external view returns (bool) {
    return isActive[u] && roles[u] == Role.Patient;
}
function isDoctor(address u) external view returns (bool) {
    return isActive[u] && roles[u] == Role.Doctor;
}
function isInsurer(address u) external view returns (bool) {
    return isActive[u] && roles[u] == Role.Insurer;
}
function isAdmin(address u) external view returns (bool) {
    return isActive[u] && roles[u] == Role.Admin;
}



}