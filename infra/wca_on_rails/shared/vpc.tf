resource "aws_default_vpc" "default" {
  tags = {
    Name = "Default VPC"
  }
}
resource "aws_default_subnet" "default_az1" {
  availability_zone = "us-west-2a"

  tags = {
    Name = "Default subnet for us-west-2a"
  }
}
resource "aws_default_subnet" "default_az2" {
  availability_zone = "us-west-2b"

  tags = {
    Name = "Default subnet for us-west-2b"
  }
}
resource "aws_default_subnet" "default_az3" {
  availability_zone = "us-west-2c"

  tags = {
    Name = "Default subnet for us-west-2c"
  }
}
resource "aws_default_subnet" "default_az4" {
  availability_zone = "us-west-2d"

  tags = {
    Name = "Default subnet for us-west-2d"
  }
}

output "private_subnets" {
  value = [aws_default_subnet.default_az1, aws_default_subnet.default_az2]
}

output "vpc_id" {
  value = aws_default_vpc.default.id
}
